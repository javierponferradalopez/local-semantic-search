import type {ListedResource} from '../../../../../src/core/resources/domain/ListedResource';
import type {ResourceReader} from '../../../../../src/core/resources/domain/ResourceReader';
import {GetResources} from '../../../../../src/core/resources/use-cases/GetResources';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const aListedResource = (overrides: Partial<ListedResource> = {}): ListedResource => {
  const id = StringMother.randomUuid();

  return {
    id,
    name: 'the notes.md',
    contentType: 'markdown',
    ingestState: 'ingesting',
    createdAt: '2026-09-22T10:00:00.000Z',
    fileKey: `resources/${id}/the notes.md`,
    ...overrides
  };
};

describe('GetResources', () => {
  let resourceReader: MockProxy<ResourceReader>;
  let fileStore: MockProxy<FileStore>;
  let getResources: GetResources;

  beforeEach(() => {
    resourceReader = mock<ResourceReader>();
    fileStore = mock<FileStore>();
    fileStore.urlOf.mockImplementation(fileKey => `/files/${fileKey.value}`);
    getResources = new GetResources({resourceReader, fileStore});
  });

  describe('#run', () => {
    it('should give the rows in the order the read model gives them', async () => {
      const newest = aListedResource({name: 'the newest.md'});
      const oldest = aListedResource({name: 'the oldest.md'});
      resourceReader.getNewestFirst.mockResolvedValue([newest, oldest]);

      const rows = await getResources.run();

      expect(rows.map(row => row.name)).toStrictEqual(['the newest.md', 'the oldest.md']);
    });

    it('should give the date the Resource was created and the URL of its File', async () => {
      const resource = aListedResource();
      resourceReader.getNewestFirst.mockResolvedValue([resource]);

      const [row] = await getResources.run();

      expect(row?.createdAt).toBe('2026-09-22T10:00:00.000Z');
      expect(row?.fileUrl).toBe(`/files/${resource.fileKey}`);
    });

    it('should keep no Reason key on a row that has none', async () => {
      resourceReader.getNewestFirst.mockResolvedValue([aListedResource()]);

      const [row] = await getResources.run();

      expect(row).not.toHaveProperty('reason');
    });

    it('should carry the Reason of a Failed row', async () => {
      resourceReader.getNewestFirst.mockResolvedValue([
        aListedResource({ingestState: 'failed', reason: 'unreadable_file'})
      ]);

      const [row] = await getResources.run();

      expect(row?.reason).toBe('unreadable_file');
    });

    it('should give nothing when no Resource is stored', async () => {
      resourceReader.getNewestFirst.mockResolvedValue([]);

      expect(await getResources.run()).toStrictEqual([]);
    });
  });
});
