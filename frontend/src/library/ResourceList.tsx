import type {ResourceRow} from 'contract/ResourceRow';
import type {JSX} from 'react';
import {textOfReason} from '@/errors/textOfReason';
import {textOfIngestState} from '@/library/textOfIngestState';

type Props = {
  rows: ResourceRow[];
  busyIds: ReadonlySet<string>;
  onRetry: (row: ResourceRow) => void;
  onDelete: (row: ResourceRow) => void;
};

export const ResourceList = ({rows, busyIds, onRetry, onDelete}: Props): JSX.Element => {
  if (rows.length === 0) {
    return <p>The library holds nothing yet.</p>;
  }

  return (
    <table className="resource-list">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Content type</th>
          <th scope="col">Ingest state</th>
          <th scope="col">Created</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const busy = busyIds.has(row.id);

          return (
            <tr key={row.id} aria-busy={busy}>
              <td>
                <a href={row.fileUrl} target="_blank" rel="noopener noreferrer">
                  {row.name}
                </a>
              </td>
              <td>{row.contentType}</td>
              <td>
                {textOfIngestState(row.ingestState)}
                {row.ingestState === 'ingesting' && <progress aria-label="Ingesting" />}
                {row.reason !== undefined && <p>{textOfReason(row.reason)}</p>}
              </td>
              <td>
                <time dateTime={row.createdAt}>
                  {new Date(row.createdAt).toLocaleString('en-GB')}
                </time>
              </td>
              <td>
                {row.ingestState === 'failed' && (
                  <button
                    type="button"
                    aria-label={`Retry ${row.name}`}
                    disabled={busy}
                    onClick={(): void => onRetry(row)}
                  >
                    {busy ? 'Retrying…' : 'Retry'}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  disabled={busy}
                  onClick={(): void => onDelete(row)}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
