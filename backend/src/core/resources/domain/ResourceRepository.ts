import type {ImageResource} from './ImageResource';
import type {TextResource} from './TextResource';
import type {Checksum} from './value-objects/Checksum';
import type {ResourceId} from './value-objects/ResourceId';

export interface ResourceRepository {
  find(id: ResourceId): Promise<ImageResource | TextResource | undefined>;
  findByChecksum(checksum: Checksum): Promise<TextResource | undefined>;
  create(resource: TextResource): Promise<void>;
  update(resource: TextResource): Promise<void>;
  delete(resource: TextResource): Promise<void>;
}
