import type {ResourceRow} from 'contract/ResourceRow';
import type {JSX} from 'react';
import {Button} from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {textOfReason} from '@/errors/textOfReason';
import {IngestStateBadge} from '@/library/IngestStateBadge';

type Props = {
  rows: ResourceRow[];
  busyIds: ReadonlySet<string>;
  onRetry: (row: ResourceRow) => void;
  onDelete: (row: ResourceRow) => void;
};

export const ResourceList = ({rows, busyIds, onRetry, onDelete}: Props): JSX.Element => {
  if (rows.length === 0) {
    return <p className="text-muted-foreground">The library holds nothing yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Name</TableHead>
          <TableHead scope="col">Content type</TableHead>
          <TableHead scope="col">Ingest state</TableHead>
          <TableHead scope="col">Created</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => {
          const busy = busyIds.has(row.id);

          return (
            <TableRow key={row.id} aria-busy={busy}>
              <TableCell>
                <a
                  href={row.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {row.name}
                </a>
              </TableCell>
              <TableCell>{row.contentType}</TableCell>
              <TableCell>
                <IngestStateBadge ingestState={row.ingestState} />
                {row.reason !== undefined && (
                  <p className="mt-1 whitespace-normal text-destructive">
                    {textOfReason(row.reason)}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <time dateTime={row.createdAt}>
                  {new Date(row.createdAt).toLocaleString('en-GB')}
                </time>
              </TableCell>
              <TableCell className="space-x-2">
                {row.ingestState === 'failed' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Retry ${row.name}`}
                    disabled={busy}
                    onClick={(): void => onRetry(row)}
                  >
                    {busy ? 'Retrying…' : 'Retry'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Delete ${row.name}`}
                  disabled={busy}
                  onClick={(): void => onDelete(row)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
