import type {ResourceRow} from 'contract/ResourceRow';
import type {JSX} from 'react';
import {ContentTypeIcon} from '@/search/ContentTypeIcon';

type Props = {rows: ResourceRow[]};

// Before a Query there is no Result, so these are Resources: no Match, no Citation.
export const RecentResourceList = ({rows}: Props): JSX.Element | null => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-resources-heading">
      <h3 id="recent-resources-heading">Recently created</h3>
      <ul className="recent-resources">
        {rows.map(row => (
          <li key={row.id} className="recent-resource">
            <ContentTypeIcon contentType={row.contentType} />{' '}
            <a href={row.fileUrl} target="_blank" rel="noopener noreferrer">
              {row.name}
            </a>{' '}
            <time dateTime={row.createdAt}>
              {new Date(row.createdAt).toLocaleString('en-GB')}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
};
