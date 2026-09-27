import {CodePointCutter} from '../../../core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../core/ingestion/infrastructure/ContentTypeTextExtractor';
import {DrizzleChunkRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import {DeleteChunksOnTextResourceDeleted} from '../../../core/ingestion/use-cases/DeleteChunksOnTextResourceDeleted';
import {IngestTextResourceOnTextResourceCreatedOrRetried} from '../../../core/ingestion/use-cases/IngestTextResourceOnTextResourceCreatedOrRetried';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {MarkTextResourceAsFailedOnTextResourceIngestFailed} from '../../../core/resources/use-cases/MarkTextResourceAsFailedOnTextResourceIngestFailed';
import {MarkTextResourceAsReadyOnTextResourceIngested} from '../../../core/resources/use-cases/MarkTextResourceAsReadyOnTextResourceIngested';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../../../core/shared/infrastructure/emittery/EmitteryEventBus';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {TransformersTextEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {container} from './Container';

export const registerDomainEventHandlers = (): void => {
  const eventBus = container.getDependency(EmitteryEventBus);
  const chunkRepository = container.getDependency(DrizzleChunkRepository);
  const resourceRepository = container.getDependency(DrizzleResourceRepository);

  eventBus.subscribe(
    new IngestTextResourceOnTextResourceCreatedOrRetried({
      fileStore: container.getDependency(FilesystemFileStore),
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
      transactionRunner: container.getDependency(DrizzleConnection)
    })
  );

  eventBus.subscribe(
    new MarkTextResourceAsFailedOnTextResourceIngestFailed({
      resourceRepository,
      transactionRunner: container.getDependency(DrizzleConnection)
    })
  );
};
