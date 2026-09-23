import {mkdtemp, readFile} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {FileStoreError} from '../../../../../src/core/shared/domain/errors/FileStoreError';
import {FileKey} from '../../../../../src/core/shared/domain/value-objects/FileKey';
import {FilesystemFileStore} from '../../../../../src/core/shared/infrastructure/FilesystemFileStore';
import {testFilesDirectory} from '../../../../lib/testInfrastructure';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const URL_PREFIX = '/files';

describe('FilesystemFileStore', () => {
  let folder: string;
  let fileStore: FilesystemFileStore;

  beforeEach(async () => {
    folder = await mkdtemp(join(testFilesDirectory(), 'file-store-'));
    fileStore = new FilesystemFileStore({folder, urlPrefix: URL_PREFIX});
  });

  describe('#store', () => {
    it('should write the bytes under the folder the application owns', async () => {
      const fileKey = aFileKey();
      const bytes = Buffer.from('the notes', 'utf8');

      await fileStore.store(fileKey, bytes);

      expect(await readFile(join(folder, fileKey.value))).toStrictEqual(bytes);
    });

    it.each(['../escaped.md', 'resources/../../escaped.md', '/etc/passwd', ''])(
      'should refuse the key %j, which resolves outside that folder',
      async value => {
        const fileKey = FileKey.fromPrimitive({value});

        await expect(fileStore.store(fileKey, Buffer.from('away'))).rejects.toThrow(
          FileStoreError
        );
      }
    );

    it('should refuse a key that resolves into a folder whose name only starts the same', async () => {
      const fileKey = FileKey.fromPrimitive({
        value: `../${basename(folder)}-evil/escaped.md`
      });

      await expect(fileStore.store(fileKey, Buffer.from('away'))).rejects.toThrow(
        FileStoreError
      );
    });
  });

  describe('#read', () => {
    it('should give back the bytes that #store wrote', async () => {
      const fileKey = aFileKey();
      const bytes = Buffer.from('the notes', 'utf8');

      await fileStore.store(fileKey, bytes);

      expect(await fileStore.read(fileKey)).toStrictEqual(bytes);
    });
  });

  describe('#delete', () => {
    it('should remove the stored File', async () => {
      const fileKey = aFileKey();
      await fileStore.store(fileKey, Buffer.from('the notes', 'utf8'));

      await fileStore.delete(fileKey);

      await expect(fileStore.read(fileKey)).rejects.toThrow();
    });
  });

  describe('#urlOf', () => {
    it('should give a URL under the prefix it serves, with each segment escaped', () => {
      const fileKey = FileKey.of({value: 'resources/an id/the notes.md'});

      expect(fileStore.urlOf(fileKey)).toBe(
        `${URL_PREFIX}/resources/an%20id/the%20notes.md`
      );
    });

    it('should escape a name that would otherwise cut the URL short', () => {
      const fileKey = FileKey.of({value: 'resources/an id/a#b?c.md'});

      expect(fileStore.urlOf(fileKey)).toBe(
        `${URL_PREFIX}/resources/an%20id/a%23b%3Fc.md`
      );
    });
  });
});

const aFileKey = (): FileKey =>
  FileKey.of({value: `resources/${StringMother.randomUuid()}/the notes.md`});
