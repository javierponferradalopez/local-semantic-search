import type {ContentType} from 'contract/ContentType';
import type {JSX} from 'react';
import {ContentTypeIcon} from '@/components/ContentTypeIcon';
import {Card, CardContent} from '@/components/ui/card';

export type Preview = {thumbnailUrl: string} | {contentType: ContentType};

type Props = {name: string; fileUrl: string} & Preview;

export const ResourceCard = ({name, fileUrl, ...preview}: Props): JSX.Element => (
  <a
    href={fileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
  >
    <Card className="gap-2 pt-0 pb-2 transition-shadow group-hover:shadow-md">
      {'thumbnailUrl' in preview ? (
        // Inside an <img>, an SVG runs no script (ADR-0004).
        <img
          src={preview.thumbnailUrl}
          alt=""
          className="aspect-square w-full bg-muted object-cover"
        />
      ) : (
        // Decorative: an icon inside the link would add its label to the name of the link.
        <div
          aria-hidden
          className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground"
        >
          <ContentTypeIcon contentType={preview.contentType} className="size-16" />
        </div>
      )}
      <CardContent className="px-2">
        <span className="block truncate" title={name}>
          {name}
        </span>
      </CardContent>
    </Card>
  </a>
);
