import type {FileKey} from '../value-objects/FileKey';

export interface FileStore {
  store(fileKey: FileKey, bytes: Buffer): Promise<void>;
  read(fileKey: FileKey): Promise<Buffer>;
  delete(fileKey: FileKey): Promise<void>;
  urlOf(fileKey: FileKey): string;
}
