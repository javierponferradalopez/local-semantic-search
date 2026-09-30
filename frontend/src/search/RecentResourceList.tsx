import type {ResourceRow} from 'contract/ResourceRow';
import type {JSX} from 'react';
import {type Preview, ResourceCard} from '@/search/ResourceCard';
import {ResourceCardGrid} from '@/search/ResourceCardGrid';

type Props = {rows: ResourceRow[]};

const previewOf = ({thumbnailUrl, contentType}: ResourceRow): Preview =>
  thumbnailUrl === undefined ? {contentType} : {thumbnailUrl};

// Before a Query there is no Result, so these are Resources: no Match, no Citation.
export const RecentResourceList = ({rows}: Props): JSX.Element | null => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-resources-heading">
      <h3 id="recent-resources-heading" className="mt-6 mb-2 text-lg font-semibold">
        Recently created
      </h3>
      <ResourceCardGrid>
        {rows.map(row => (
          <li key={row.id}>
            <ResourceCard name={row.name} fileUrl={row.fileUrl} {...previewOf(row)} />
          </li>
        ))}
      </ResourceCardGrid>
    </section>
  );
};
