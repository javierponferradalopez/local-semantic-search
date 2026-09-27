import type {ReasonCode} from 'contract/ReasonCode';
import {TextResourceCreatedDomainEvent} from '../../resources/domain/events/TextResourceCreatedDomainEvent';
import {TextResourceRetriedDomainEvent} from '../../resources/domain/events/TextResourceRetriedDomainEvent';
import type {ResourceRepository} from '../../resources/domain/ResourceRepository';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {DomainEvent} from '../../shared/domain/DomainEvent';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {Chunk} from '../domain/Chunk';
import type {ChunkRepository, EmbeddedChunk} from '../domain/ChunkRepository';
import type {Cutter} from '../domain/Cutter';
import {UnreadableFileError} from '../domain/errors/UnreadableFileError';
import {TextResourceIngestedDomainEvent} from '../domain/events/TextResourceIngestedDomainEvent';
import {TextResourceIngestFailedDomainEvent} from '../domain/events/TextResourceIngestFailedDomainEvent';
import type {TextExtractor} from '../domain/TextExtractor';

type TextResourceCreatedOrRetried =
  | TextResourceCreatedDomainEvent
  | TextResourceRetriedDomainEvent;

type ConstructorParams = {
  fileStore: FileStore;
  textExtractor: TextExtractor;
  cutter: Cutter;
  textEmbedder: TextEmbedder;
  chunkRepository: ChunkRepository;
  resourceRepository: ResourceRepository;
  eventBus: EventBus;
};

export class IngestTextResourceOnTextResourceCreatedOrRetried
  implements DomainEventHandler<TextResourceCreatedOrRetried>
{
  private readonly fileStore: FileStore;
  private readonly textExtractor: TextExtractor;
  private readonly cutter: Cutter;
  private readonly textEmbedder: TextEmbedder;
  private readonly chunkRepository: ChunkRepository;
  private readonly resourceRepository: ResourceRepository;
  private readonly eventBus: EventBus;

  public constructor(params: ConstructorParams) {
    this.fileStore = params.fileStore;
    this.textExtractor = params.textExtractor;
    this.cutter = params.cutter;
    this.textEmbedder = params.textEmbedder;
    this.chunkRepository = params.chunkRepository;
    this.resourceRepository = params.resourceRepository;
    this.eventBus = params.eventBus;
  }

  public subscribeTo(): [
    typeof TextResourceCreatedDomainEvent,
    typeof TextResourceRetriedDomainEvent
  ] {
    return [TextResourceCreatedDomainEvent, TextResourceRetriedDomainEvent];
  }

  public async handle(event: TextResourceCreatedOrRetried): Promise<void> {
    const resourceId = ResourceId.of({value: event.aggregateId});

    const events = await this.ingest(resourceId, event).catch((error: unknown) => {
      // The detail is for the developer, and never reaches the event.
      console.error('The Ingest of a Resource failed', error);

      return [failureOf(resourceId, reasonOf(error))];
    });

    void this.eventBus.publish(events);
  }

  private async ingest(
    resourceId: ResourceId,
    event: TextResourceCreatedOrRetried
  ): Promise<DomainEvent[]> {
    await this.chunkRepository.deleteManyByResourceId(resourceId);

    const bytes = await this.fileStore.read(FileKey.of({value: event.fileKey}));
    const texts = await this.textExtractor.extract(bytes, event.contentType);
    const chunks = this.cutter.cut({resourceId, contentType: event.contentType, texts});

    // One rule for each Content type: a scan, an empty file, a file with no letter and no digit.
    if (chunks.length === 0) {
      return [failureOf(resourceId, 'no_text_found')];
    }

    const embeddedChunks = await this.embed(chunks);

    await this.chunkRepository.createMany(embeddedChunks);

    // A Delete during the Ingest can find no Chunk to delete, so the Ingest deletes what it wrote.
    if ((await this.resourceRepository.find(resourceId)) === undefined) {
      await this.chunkRepository.deleteManyByResourceId(resourceId);

      return [];
    }

    return [
      ...chunks.flatMap(chunk => chunk.pullEvents()),
      new TextResourceIngestedDomainEvent({aggregateId: resourceId.value})
    ];
  }

  // One at a time: the port is singular, and the work blocks nobody (ADR-0018).
  private async embed(chunks: readonly Chunk[]): Promise<EmbeddedChunk[]> {
    const embeddedChunks: EmbeddedChunk[] = [];

    for (const chunk of chunks) {
      const vector = await this.textEmbedder.embedChunk(chunk.text.value);

      embeddedChunks.push({chunk, vector});
    }

    return embeddedChunks;
  }
}

const reasonOf = (error: unknown): ReasonCode =>
  error instanceof UnreadableFileError ? 'unreadable_file' : 'ingest_error';

const failureOf = (
  resourceId: ResourceId,
  reason: ReasonCode
): TextResourceIngestFailedDomainEvent =>
  new TextResourceIngestFailedDomainEvent({aggregateId: resourceId.value, reason});
