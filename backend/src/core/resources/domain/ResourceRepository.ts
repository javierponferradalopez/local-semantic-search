import type {ImageResource} from './ImageResource';
import type {TextResource} from './TextResource';
import type {Checksum} from './value-objects/Checksum';
import type {ResourceId} from './value-objects/ResourceId';

export interface ResourceRepository {
  find(id: ResourceId): Promise<ImageResource | TextResource | undefined>;
  // The Checksum is unique within each aggregate, so each has its own read (ADR-0019).
  findTextResourceByChecksum(checksum: Checksum): Promise<TextResource | undefined>;
  findImageResourceByChecksum(checksum: Checksum): Promise<ImageResource | undefined>;
  create(resource: ImageResource | TextResource): Promise<void>;
  update(resource: ImageResource | TextResource): Promise<void>;
  delete(resource: ImageResource | TextResource): Promise<void>;
}
