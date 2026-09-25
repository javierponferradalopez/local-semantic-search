import {TextResourceCreatedDomainEvent} from '../../resources/domain/events/TextResourceCreatedDomainEvent';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {Chunk} from '../domain/Chunk';
import type {ChunkRepository, EmbeddedChunk} from '../domain/ChunkRepository';
import type {Cutter} from '../domain/Cutter';
import {TextResourceIngestedDomainEvent} from '../domain/events/TextResourceIngestedDomainEvent';
import type {TextExtractor} from '../domain/TextExtractor';

type ConstructorParams = {
  fileStore: FileStore;
  textExtractor: TextExtractor;
  cutter: Cutter;
  textEmbedder: TextEmbedder;
  chunkRepository: ChunkRepository;
  eventBus: EventBus;
};

export class IngestTextResourceOnTextResourceCreated
  implements DomainEventHandler<TextResourceCreatedDomainEvent>
{
  private readonly fileStore: FileStore;
  private readonly textExtractor: TextExtractor;
  private readonly cutter: Cutter;
  private readonly textEmbedder: TextEmbedder;
  private readonly chunkRepository: ChunkRepository;
  private readonly eventBus: EventBus;

  public constructor(params: ConstructorParams) {
    this.fileStore = params.fileStore;
    this.textExtractor = params.textExtractor;
    this.cutter = params.cutter;
    this.textEmbedder = params.textEmbedder;
    this.chunkRepository = params.chunkRepository;
    this.eventBus = params.eventBus;
  }

  public subscribeTo(): [typeof TextResourceCreatedDomainEvent] {
    return [TextResourceCreatedDomainEvent];
  }

  public async handle(event: TextResourceCreatedDomainEvent): Promise<void> {
    const resourceId = ResourceId.of({value: event.aggregateId});

    await this.chunkRepository.deleteAllOf(resourceId);

    const bytes = await this.fileStore.read(FileKey.of({value: event.fileKey}));
    const texts = await this.textExtractor.extract(bytes, event.contentType);
    const chunks = this.cutter.cut({resourceId, contentType: event.contentType, texts});
    const embeddedChunks = await this.embed(chunks);

    await this.chunkRepository.saveAll(embeddedChunks);

    void this.eventBus.publish([
      ...chunks.flatMap(chunk => chunk.pullEvents()),
      new TextResourceIngestedDomainEvent({aggregateId: resourceId.value})
    ]);
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
