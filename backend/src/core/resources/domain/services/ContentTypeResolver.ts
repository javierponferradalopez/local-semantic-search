import type {ImageContentType} from '../value-objects/ImageContentType';
import type {TextContentType} from '../value-objects/TextContentType';

export interface ContentTypeResolver {
  resolveText(name: string): TextContentType;
  resolveImage(name: string): ImageContentType;
}
