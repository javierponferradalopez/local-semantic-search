import type {TextResource} from './TextResource';
import type {Checksum} from './value-objects/Checksum';
import type {ResourceId} from './value-objects/ResourceId';

export interface ResourceRepository {
  find(id: ResourceId): Promise<TextResource | undefined>;
  findByChecksum(checksum: Checksum): Promise<TextResource | undefined>;
  save(resource: TextResource): Promise<void>;
  delete(resource: TextResource): Promise<void>;
}
