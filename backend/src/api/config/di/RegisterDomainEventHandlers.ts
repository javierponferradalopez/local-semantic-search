import {CodePointCutter} from '../../../core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../core/ingestion/infrastructure/ContentTypeTextExtractor';
import {DrizzleChunkRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import {DrizzlePictureRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzlePictureRepository';
import {SharpImageDecoder} from '../../../core/ingestion/infrastructure/sharp/SharpImageDecoder';
import {DeleteChunksOnTextResourceDeleted} from '../../../core/ingestion/use-cases/DeleteChunksOnTextResourceDeleted';
import {IngestImageResourceOnImageResourceCreatedOrRetried} from '../../../core/ingestion/use-cases/IngestImageResourceOnImageResourceCreatedOrRetried';
import {IngestTextResourceOnTextResourceCreatedOrRetried} from '../../../core/ingestion/use-cases/IngestTextResourceOnTextResourceCreatedOrRetried';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {MarkImageResourceAsFailedOnImageResourceIngestFailed} from '../../../core/resources/use-cases/MarkImageResourceAsFailedOnImageResourceIngestFailed';
import {MarkImageResourceAsReadyOnImageResourceIngested} from '../../../core/resources/use-cases/MarkImageResourceAsReadyOnImageResourceIngested';
import {MarkTextResourceAsFailedOnTextResourceIngestFailed} from '../../../core/resources/use-cases/MarkTextResourceAsFailedOnTextResourceIngestFailed';
import {MarkTextResourceAsReadyOnTextResourceIngested} from '../../../core/resources/use-cases/MarkTextResourceAsReadyOnTextResourceIngested';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../../../core/shared/infrastructure/emittery/EmitteryEventBus';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {TransformersImageEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {TransformersTextEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {container} from './Container';

export const registerDomainEventHandlers = (): void => {
  const eventBus = container.getDependency(EmitteryEventBus);
  const chunkRepository = container.getDependency(DrizzleChunkRepository);
  const resourceRepository = container.getDependency(DrizzleResourceRepository);
  const fileStore = container.getDependency(FilesystemFileStore);
  const transactionRunner = container.getDependency(DrizzleConnection);

  eventBus.subscribe(
    new IngestTextResourceOnTextResourceCreatedOrRetried({
      fileStore,
      textExtractor: container.getDependency(ContentTypeTextExtractor),
      cutter: container.getDependency(CodePointCutter),
      textEmbedder: container.getDependency(TransformersTextEmbedder),
      chunkRepository,
      resourceRepository,
      eventBus
    })
  );

  eventBus.subscribe(new DeleteChunksOnTextResourceDeleted({chunkRepository}));

  eventBus.subscribe(
    new MarkTextResourceAsReadyOnTextResourceIngested({
      resourceRepository,
      transactionRunner
    })
  );

  eventBus.subscribe(
    new MarkTextResourceAsFailedOnTextResourceIngestFailed({
      resourceRepository,
      transactionRunner
    })
  );

  eventBus.subscribe(
    new IngestImageResourceOnImageResourceCreatedOrRetried({
      fileStore,
      imageDecoder: container.getDependency(SharpImageDecoder),
      imageEmbedder: container.getDependency(TransformersImageEmbedder),
      pictureRepository: container.getDependency(DrizzlePictureRepository),
      resourceRepository,
      eventBus
    })
  );

  eventBus.subscribe(
    new MarkImageResourceAsReadyOnImageResourceIngested({
      resourceRepository,
      transactionRunner
    })
  );

  eventBus.subscribe(
    new MarkImageResourceAsFailedOnImageResourceIngestFailed({
      resourceRepository,
      transactionRunner
    })
  );
};
