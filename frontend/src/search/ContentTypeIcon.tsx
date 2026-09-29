import {cn} from 'cn';
import type {ContentType} from 'contract/ContentType';
import {FileCode, FileText, FileType, Image, type LucideIcon} from 'lucide-react';
import type {JSX} from 'react';

const ICON_OF: Record<ContentType, {Icon: LucideIcon; label: string}> = {
  pdf: {Icon: FileText, label: 'PDF'},
  plain_text: {Icon: FileType, label: 'Plain text'},
  markdown: {Icon: FileCode, label: 'Markdown'},
  jpeg: {Icon: Image, label: 'JPEG'},
  png: {Icon: Image, label: 'PNG'},
  webp: {Icon: Image, label: 'WebP'},
  gif: {Icon: Image, label: 'GIF'},
  avif: {Icon: Image, label: 'AVIF'},
  svg: {Icon: Image, label: 'SVG'}
};

type Props = {contentType: ContentType; className?: string};

export const ContentTypeIcon = ({contentType, className}: Props): JSX.Element => {
  const {Icon, label} = ICON_OF[contentType];

  return (
    <span role="img" aria-label={label} title={label} className="inline-flex">
      <Icon aria-hidden className={cn('size-4', className)} />
    </span>
  );
};
