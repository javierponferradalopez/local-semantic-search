import type {ImageContentType} from 'contract/ContentType';
import type {MockInstance} from 'vitest';
import {ImageTooLargeError} from '../../../../../src/core/ingestion/domain/errors/ImageTooLargeError';
import {UnreadableFileError} from '../../../../../src/core/ingestion/domain/errors/UnreadableFileError';
import {ImageResourceIngestedDomainEvent} from '../../../../../src/core/ingestion/domain/events/ImageResourceIngestedDomainEvent';
import {ImageResourceIngestFailedDomainEvent} from '../../../../../src/core/ingestion/domain/events/ImageResourceIngestFailedDomainEvent';
import {PictureCreatedDomainEvent} from '../../../../../src/core/ingestion/domain/events/PictureCreatedDomainEvent';
import type {
  DecodedImage,
  ImageDecoder
} from '../../../../../src/core/ingestion/domain/ImageDecoder';
import type {PictureRepository} from '../../../../../src/core/ingestion/domain/PictureRepository';
import {IngestImageResourceOnImageResourceCreatedOrRetried} from '../../../../../src/core/ingestion/use-cases/IngestImageResourceOnImageResourceCreatedOrRetried';
import {ImageResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceCreatedDomainEvent';
import {ImageResourceRetriedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceRetriedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {ImageEmbedder} from '../../../../../src/core/shared/domain/services/ImageEmbedder';
import type {Vector} from '../../../../../src/core/shared/domain/value-objects/Vector';
import {VISION_MODEL} from '../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

const THE_BYTES = Buffer.from('the bytes of the beach');
const THE_DECODED_IMAGE: DecodedImage = {
  pixels: {data: new Uint8Array([1, 2, 3]), width: 1, height: 1, channels: 3},
  thumbnail: Buffer.from('the thumbnail of the beach')
};

type ImageResourceCreatedOrRetried =
  | ImageResourceCreatedDomainEvent
  | ImageResourceRetriedDomainEvent;

const thumbnailKeyOf = (event: ImageResourceCreatedOrRetried): string =>
  `ingestion/thumbnails/${event.aggregateId}.webp`;

describe('IngestImageResourceOnImageResourceCreatedOrRetried', () => {
  let fileStore: MockProxy<FileStore>;
  let imageDecoder: MockProxy<ImageDecoder>;
  let imageEmbedder: MockProxy<ImageEmbedder>;
  let pictureRepository: MockProxy<PictureRepository>;
  let resourceRepository: MockProxy<ResourceRepository>;
  let eventBus: MockProxy<EventBus>;
  let handler: IngestImageResourceOnImageResourceCreatedOrRetried;
  let steps: string[];
  let vector: Vector;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    steps = [];
    fileStore = mock<FileStore>();
    imageDecoder = mock<ImageDecoder>();
    imageEmbedder = mock<ImageEmbedder>();
    pictureRepository = mock<PictureRepository>();
    resourceRepository = mock<ResourceRepository>();
    eventBus = mock<EventBus>();

    vector = VectorMother.random(VISION_MODEL);

    fileStore.read.mockResolvedValue(THE_BYTES);
    fileStore.store.mockImplementation(async () => {
      steps.push('store the thumbnail');
    });
    fileStore.delete.mockImplementation(async () => {
      steps.push('delete the thumbnail');
    });
    imageDecoder.decode.mockResolvedValue(THE_DECODED_IMAGE);
    imageEmbedder.embedPicture.mockResolvedValue(vector);
    pictureRepository.deleteManyByResourceId.mockImplementation(async () => {
      steps.push('delete');
    });
    pictureRepository.create.mockImplementation(async () => {
      steps.push('create');
    });
    resourceRepository.find.mockImplementation(async () => {
      steps.push('find');

      return ImageResourceBuilder.anImageResource().build();
    });
    eventBus.publish.mockImplementation(async () => {
      steps.push('publish');
    });

    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    handler = new IngestImageResourceOnImageResourceCreatedOrRetried({
      fileStore,
      imageDecoder,
      imageEmbedder,
      pictureRepository,
      resourceRepository,
      eventBus
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('#subscribeTo', () => {
    it('should subscribe to ImageResourceCreatedDomainEvent and ImageResourceRetriedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([
        ImageResourceCreatedDomainEvent,
        ImageResourceRetriedDomainEvent
      ]);
    });
  });

  describe('#handle', () => {
    describe.each([
      ['ImageResourceCreatedDomainEvent', ImageResourceCreatedDomainEvent],
      ['ImageResourceRetriedDomainEvent', ImageResourceRetriedDomainEvent]
    ])('of %s', (_, EventClass) => {
      const anEventOfAResource = (
        contentType: ImageContentType = 'png'
      ): ImageResourceCreatedOrRetried => {
        const aggregateId = StringMother.randomUuid();

        return new EventClass({
          aggregateId,
          contentType,
          fileKey: `resources/${aggregateId}/the beach.png`
        });
      };

      it('should delete the previous output of the Resource before it writes', async () => {
        const event = anEventOfAResource();

        await handler.handle(event);

        expect(pictureRepository.deleteManyByResourceId.mock.calls[0]?.[0].value).toBe(
          event.aggregateId
        );
        expect(fileStore.delete.mock.calls[0]?.[0].value).toBe(thumbnailKeyOf(event));
        expect(steps.slice(0, 2)).toStrictEqual(['delete', 'delete the thumbnail']);
      });

      it('should read the File under its key, and decode it by its Content type', async () => {
        const event = anEventOfAResource('svg');

        await handler.handle(event);

        expect(fileStore.read.mock.calls[0]?.[0].value).toBe(event.fileKey);
        expect(imageDecoder.decode).toHaveBeenCalledWith(THE_BYTES, 'svg');
      });

      it('should embed the pixels of the decode', async () => {
        await handler.handle(anEventOfAResource());

        expect(imageEmbedder.embedPicture).toHaveBeenCalledWith(THE_DECODED_IMAGE.pixels);
      });

      it('should store the thumbnail of the decode under a prefix of ingestion', async () => {
        const event = anEventOfAResource();

        await handler.handle(event);

        const [key, bytes] = fileStore.store.mock.calls[0] ?? [];

        expect(key?.value).toBe(thumbnailKeyOf(event));
        expect(bytes).toBe(THE_DECODED_IMAGE.thumbnail);
      });

      it('should write the Picture, its Vector and the key of its thumbnail in one write', async () => {
        const event = anEventOfAResource();

        await handler.handle(event);

        const [embeddedPicture] = pictureRepository.create.mock.calls[0] ?? [];

        expect(pictureRepository.create).toHaveBeenCalledTimes(1);
        expect(embeddedPicture?.picture.toPrimitives()).toStrictEqual({
          resourceId: event.aggregateId,
          thumbnailKey: thumbnailKeyOf(event)
        });
        expect(embeddedPicture?.vector).toBe(vector);
      });

      it('should raise PictureCreatedDomainEvent and ImageResourceIngestedDomainEvent after the write', async () => {
        const event = anEventOfAResource();

        await handler.handle(event);

        expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
          new PictureCreatedDomainEvent({aggregateId: event.aggregateId}),
          new ImageResourceIngestedDomainEvent({aggregateId: event.aggregateId})
        ]);
        expect(steps).toStrictEqual([
          'delete',
          'delete the thumbnail',
          'store the thumbnail',
          'create',
          'find',
          'publish'
        ]);
      });

      it('should delete its output and raise no event when the Resource is gone after the write', async () => {
        const event = anEventOfAResource();
        resourceRepository.find.mockImplementation(async () => {
          steps.push('find');

          return undefined;
        });

        await handler.handle(event);

        expect(resourceRepository.find.mock.calls[0]?.[0].value).toBe(event.aggregateId);
        expect(pictureRepository.deleteManyByResourceId.mock.calls[1]?.[0].value).toBe(
          event.aggregateId
        );
        expect(fileStore.delete.mock.calls[1]?.[0].value).toBe(thumbnailKeyOf(event));
        expect(steps.slice(4)).toStrictEqual([
          'find',
          'delete',
          'delete the thumbnail',
          'publish'
        ]);
        expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([]);
      });

      it.each([
        [
          'the decoder',
          (): void => {
            imageDecoder.decode.mockRejectedValue(new Error('Boom'));
          }
        ],
        [
          'the embedder',
          (): void => {
            imageEmbedder.embedPicture.mockRejectedValue(new Error('Boom'));
          }
        ],
        [
          'the write',
          (): void => {
            pictureRepository.create.mockRejectedValue(new Error('Boom'));
          }
        ]
      ])(
        'should raise ImageResourceIngestFailedDomainEvent with ingest_error when %s throws',
        async (_, throwIt) => {
          throwIt();
          const event = anEventOfAResource();

          await handler.handle(event);

          expect(eventBus.publish).toHaveBeenCalledTimes(1);
          expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
            new ImageResourceIngestFailedDomainEvent({
              aggregateId: event.aggregateId,
              reason: 'ingest_error'
            })
          ]);
        }
      );

      it.each([
        [
          'image_too_large',
          'the decoder refuses the image past the pixel ceiling',
          ImageTooLargeError.causeItHoldsMorePixelsThanTheCeiling(
            'png',
            new Error('Input image exceeds pixel limit')
          )
        ],
        [
          'unreadable_file',
          'the decoder cannot read the File',
          UnreadableFileError.causeTheBytesCannotBeReadAs(
            'png',
            new Error('Input buffer contains unsupported image format')
          )
        ]
      ] as const)(
        'should raise ImageResourceIngestFailedDomainEvent with %s when %s',
        async (reason, _, error) => {
          imageDecoder.decode.mockRejectedValue(error);
          const event = anEventOfAResource();

          await handler.handle(event);

          expect(eventBus.publish).toHaveBeenCalledTimes(1);
          expect(eventBus.publish.mock.calls[0]?.[0]).toStrictEqual([
            new ImageResourceIngestFailedDomainEvent({
              aggregateId: event.aggregateId,
              reason
            })
          ]);
          expect(pictureRepository.create).not.toHaveBeenCalled();
          expect(fileStore.store).not.toHaveBeenCalled();
        }
      );

      it('should give the detail of the error to the developer log, and not to the event', async () => {
        const error = new Error('The connection broke');
        pictureRepository.create.mockRejectedValue(error);

        await handler.handle(anEventOfAResource());

        expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
        expect(JSON.stringify(eventBus.publish.mock.calls[0]?.[0])).not.toContain(
          'The connection broke'
        );
      });

      it('should not wait for the handlers of its events', async () => {
        eventBus.publish.mockImplementation(() => new Promise(() => {}));

        await expect(handler.handle(anEventOfAResource())).resolves.toBeUndefined();
      });
    });
  });
});
