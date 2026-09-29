import type {PictureRepository} from '../../../../../src/core/ingestion/domain/PictureRepository';
import {DeletePictureOnImageResourceDeleted} from '../../../../../src/core/ingestion/use-cases/DeletePictureOnImageResourceDeleted';
import {ImageResourceDeletedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceDeletedDomainEvent';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('DeletePictureOnImageResourceDeleted', () => {
  let pictureRepository: MockProxy<PictureRepository>;
  let fileStore: MockProxy<FileStore>;
  let handler: DeletePictureOnImageResourceDeleted;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    pictureRepository = mock<PictureRepository>();
    fileStore = mock<FileStore>();

    pictureRepository.deleteManyByResourceId.mockImplementation(async () => {
      steps.push('delete');
    });
    fileStore.delete.mockImplementation(async () => {
      steps.push('delete the thumbnail');
    });

    handler = new DeletePictureOnImageResourceDeleted({pictureRepository, fileStore});
  });

  describe('#subscribeTo', () => {
    it('should subscribe to ImageResourceDeletedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([ImageResourceDeletedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should delete the Picture and the Vector of the Resource', async () => {
      const aggregateId = StringMother.randomUuid();

      await handler.handle(new ImageResourceDeletedDomainEvent({aggregateId}));

      expect(pictureRepository.deleteManyByResourceId).toHaveBeenCalledTimes(1);
      expect(pictureRepository.deleteManyByResourceId.mock.calls[0]?.[0].value).toBe(
        aggregateId
      );
    });

    it('should delete the thumbnail of the Resource under its key in ingestion', async () => {
      const aggregateId = StringMother.randomUuid();

      await handler.handle(new ImageResourceDeletedDomainEvent({aggregateId}));

      expect(fileStore.delete).toHaveBeenCalledTimes(1);
      expect(fileStore.delete.mock.calls[0]?.[0].value).toBe(
        `ingestion/thumbnails/${aggregateId}.webp`
      );
    });

    it('should delete the Picture and the Vector before the thumbnail', async () => {
      await handler.handle(
        new ImageResourceDeletedDomainEvent({aggregateId: StringMother.randomUuid()})
      );

      expect(steps).toStrictEqual(['delete', 'delete the thumbnail']);
    });
  });
});
