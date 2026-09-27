import {CONTENT_TYPES, type ContentType} from 'contract/ContentType';
import type {MockInstance} from 'vitest';
import type {Chunk} from '../../../../../src/core/ingestion/domain/Chunk';
import type {ChunkRepository} from '../../../../../src/core/ingestion/domain/ChunkRepository';
import type {Cutter} from '../../../../../src/core/ingestion/domain/Cutter';
import {UnreadableFileError} from '../../../../../src/core/ingestion/domain/errors/UnreadableFileError';
import {TextResourceIngestedDomainEvent} from '../../../../../src/core/ingestion/domain/events/TextResourceIngestedDomainEvent';
import {TextResourceIngestFailedDomainEvent} from '../../../../../src/core/ingestion/domain/events/TextResourceIngestFailedDomainEvent';
import type {TextExtractor} from '../../../../../src/core/ingestion/domain/TextExtractor';
import {IngestTextResourceOnTextResourceCreated} from '../../../../../src/core/ingestion/use-cases/IngestTextResourceOnTextResourceCreated';
import {TextResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TextEmbedder} from '../../../../../src/core/shared/domain/services/TextEmbedder';
import type {Vector} from '../../../../../src/core/shared/domain/value-objects/Vector';
import {ChunkBuilder} from '../../../../utils/builders/chunk/ChunkBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

const THE_BYTES = Buffer.from('The first paragraph.\n\nThe second paragraph.');
const THE_TEXTS = ['The first paragraph.\n\nThe second paragraph.'];

describe('IngestTextResourceOnTextResourceCreated', () => {
  let fileStore: MockProxy<FileStore>;
  let textExtractor: MockProxy<TextExtractor>;
  let cutter: MockProxy<Cutter>;
  let textEmbedder: MockProxy<TextEmbedder>;
  let chunkRepository: MockProxy<ChunkRepository>;
  let eventBus: MockProxy<EventBus>;
  let handler: IngestTextResourceOnTextResourceCreated;
  let steps: string[];
  let chunks: Chunk[];
  let vectors: Vector[];
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    steps = [];
    fileStore = mock<FileStore>();
    textExtractor = mock<TextExtractor>();
    cutter = mock<Cutter>();
    textEmbedder = mock<TextEmbedder>();
    chunkRepository = mock<ChunkRepository>();
    eventBus = mock<EventBus>();

    chunks = [
      ChunkBuilder.aChunk().withPosition(0).build(),
      ChunkBuilder.aChunk().withPosition(1).build()
    ];
    vectors = [VectorMother.random(), VectorMother.random()];

    fileStore.read.mockResolvedValue(THE_BYTES);
    textExtractor.extract.mockResolvedValue(THE_TEXTS);
    cutter.cut.mockReturnValue(chunks);
    textEmbedder.embedChunk.mockImplementation(async text => {
      const index = chunks.findIndex(chunk => chunk.text.value === text);

      return vectors[index] as Vector;
    });
    chunkRepository.deleteManyByResourceId.mockImplementation(async () => {
      steps.push('delete');
    });
    chunkRepository.createMany.mockImplementation(async () => {
      steps.push('create');
    });
    eventBus.publish.mockImplementation(async () => {
      steps.push('publish');
    });

    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    handler = new IngestTextResourceOnTextResourceCreated({
      fileStore,
      textExtractor,
      cutter,
      textEmbedder,
      chunkRepository,
      eventBus
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('#subscribeTo', () => {
    it('should subscribe to TextResourceCreatedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([TextResourceCreatedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should delete the previous output of the Resource before it writes', async () => {
      const event = anEventOfACreatedResource();

      await handler.handle(event);

      expect(chunkRepository.deleteManyByResourceId.mock.calls[0]?.[0].value).toBe(
        event.aggregateId
      );
      expect(steps.indexOf('delete')).toBeLessThan(steps.indexOf('create'));
    });

    it('should read the File under its key, and extract its texts by its Content type', async () => {
      const event = anEventOfACreatedResource();

      await handler.handle(event);

      expect(fileStore.read.mock.calls[0]?.[0].value).toBe(event.fileKey);
      expect(textExtractor.extract).toHaveBeenCalledWith(THE_BYTES, 'plain_text');
    });

    it('should cut the texts for the Resource and its Content type', async () => {
      const event = anEventOfACreatedResource();

      await handler.handle(event);

      const [params] = cutter.cut.mock.calls[0] ?? [];

      expect(params?.resourceId.value).toBe(event.aggregateId);
      expect(params?.contentType).toBe('plain_text');
      expect(params?.texts).toStrictEqual(THE_TEXTS);
    });

    it('should write each Chunk with its Vector, in one write', async () => {
      await handler.handle(anEventOfACreatedResource());

      expect(chunkRepository.createMany).toHaveBeenCalledTimes(1);
      expect(chunkRepository.createMany).toHaveBeenCalledWith([
        {chunk: chunks[0], vector: vectors[0]},
        {chunk: chunks[1], vector: vectors[1]}
      ]);
    });

    it('should raise TextResourceIngestedDomainEvent after the write', async () => {
      const event = anEventOfACreatedResource();

      await handler.handle(event);

      const [events] = eventBus.publish.mock.calls[0] ?? [];
      const ingested = events?.find(
        published => published instanceof TextResourceIngestedDomainEvent
      );

      expect(ingested?.aggregateId).toBe(event.aggregateId);
      expect(steps).toStrictEqual(['delete', 'create', 'publish']);
    });

    it.each(CONTENT_TYPES)(
      'should raise TextResourceIngestFailedDomainEvent with no_text_found when the cut of a %s gives no Chunk',
      async contentType => {
        cutter.cut.mockReturnValue([]);
        const event = anEventOfACreatedResource(contentType);

        await handler.handle(event);

        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
          new TextResourceIngestFailedDomainEvent({
            aggregateId: event.aggregateId,
            reason: 'no_text_found'
          })
        ]);
      }
    );

    it('should embed nothing and write nothing when the cut gives no Chunk', async () => {
      cutter.cut.mockReturnValue([]);

      await handler.handle(anEventOfACreatedResource());

      expect(textEmbedder.embedChunk).not.toHaveBeenCalled();
      expect(chunkRepository.createMany).not.toHaveBeenCalled();
      expect(steps).toStrictEqual(['delete', 'publish']);
    });

    it('should raise TextResourceIngestFailedDomainEvent with unreadable_file when the extractor cannot read the File', async () => {
      textExtractor.extract.mockRejectedValue(
        UnreadableFileError.causeTheBytesCannotBeReadAs('pdf', new Error('Invalid PDF'))
      );
      const event = anEventOfACreatedResource('pdf');

      await handler.handle(event);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
        new TextResourceIngestFailedDomainEvent({
          aggregateId: event.aggregateId,
          reason: 'unreadable_file'
        })
      ]);
    });

    it('should raise TextResourceIngestFailedDomainEvent with ingest_error for an error that no port translated', async () => {
      chunkRepository.createMany.mockRejectedValue(new Error('The connection broke'));
      const event = anEventOfACreatedResource();

      await handler.handle(event);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
        new TextResourceIngestFailedDomainEvent({
          aggregateId: event.aggregateId,
          reason: 'ingest_error'
        })
      ]);
    });

    it('should give the detail of the error to the developer log, and not to the event', async () => {
      const error = new Error('The connection broke');
      chunkRepository.createMany.mockRejectedValue(error);

      await handler.handle(anEventOfACreatedResource());

      expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
      expect(JSON.stringify(eventBus.publish.mock.calls[0]?.[0])).not.toContain(
        'The connection broke'
      );
    });

    it('should not wait for the handlers of its events', async () => {
      eventBus.publish.mockImplementation(() => new Promise(() => {}));

      await expect(handler.handle(anEventOfACreatedResource())).resolves.toBeUndefined();
    });
  });
});

const anEventOfACreatedResource = (
  contentType: ContentType = 'plain_text'
): TextResourceCreatedDomainEvent => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceCreatedDomainEvent({
    aggregateId,
    contentType,
    fileKey: `resources/${aggregateId}/the notes.txt`
  });
};
