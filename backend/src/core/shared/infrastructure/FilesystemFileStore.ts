import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, relative, resolve, sep} from 'node:path';
import {FileStoreError} from '../domain/errors/FileStoreError';
import type {FileStore} from '../domain/services/FileStore';
import type {FileKey} from '../domain/value-objects/FileKey';

type ConstructorParams = {folder: string; urlPrefix: string};

export class FilesystemFileStore implements FileStore {
  private readonly folder: string;
  private readonly urlPrefix: string;

  public constructor({folder, urlPrefix}: ConstructorParams) {
    this.folder = resolve(folder);
    this.urlPrefix = urlPrefix;
  }

  public async store(fileKey: FileKey, bytes: Buffer): Promise<void> {
    const path = this.pathOf(fileKey);

    await mkdir(dirname(path), {recursive: true});
    await writeFile(path, bytes);
  }

  public read(fileKey: FileKey): Promise<Buffer> {
    return readFile(this.pathOf(fileKey));
  }

  public async delete(fileKey: FileKey): Promise<void> {
    await rm(this.pathOf(fileKey), {force: true});
  }

  public urlOf(fileKey: FileKey): string {
    const path = relative(this.folder, this.pathOf(fileKey))
      .split(sep)
      .map(encodeURIComponent)
      .join('/');

    return `${this.urlPrefix}/${path}`;
  }

  private pathOf(fileKey: FileKey): string {
    const path = resolve(this.folder, fileKey.value);

    if (!path.startsWith(`${this.folder}${sep}`)) {
      throw FileStoreError.causeTheKeyEscapesItsFolder(fileKey.value);
    }

    return path;
  }
}
