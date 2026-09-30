import type {ImageResult} from 'contract/ImageResult';
import type {JSX} from 'react';
import {ResourceCard} from '@/search/ResourceCard';
import {ResourceCardGrid} from '@/search/ResourceCardGrid';

type Props = {results: ImageResult[]};

// A Picture is its whole Resource, so it has no place to cite.
export const ImageResultGrid = ({results}: Props): JSX.Element => {
  if (results.length === 0) {
    return <p className="text-muted-foreground">No image was found.</p>;
  }

  return (
    <ResourceCardGrid>
      {results.map(result => (
        <li key={result.resourceId}>
          <ResourceCard
            name={result.name}
            fileUrl={result.fileUrl}
            thumbnailUrl={result.thumbnailUrl}
          />
        </li>
      ))}
    </ResourceCardGrid>
  );
};
