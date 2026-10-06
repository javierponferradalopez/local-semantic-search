import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, useState} from 'react';
import {EmptyState} from '@/components/EmptyState';
import {RefusalAlert} from '@/components/RefusalAlert';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {DeleteResourceDialog} from '@/library/DeleteResourceDialog';
import {ResourceList} from '@/library/ResourceList';
import {useResources} from '@/resources/ResourcesContext';

type Props = {onUpload: () => void};

export const LibrarySection = ({onUpload}: Props): JSX.Element => {
  const resources = useResources();
  const [refusal, setRefusal] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [toDelete, setToDelete] = useState<ResourceRow>();
  const deleting = toDelete !== undefined && busyIds.has(toDelete.id);

  // It stays until a list succeeds, because until then the Library does not hold the whole list.
  const refusalOfTheList =
    resources.listFailure === undefined ? [] : textsOfFailure(resources.listFailure);

  const refuse = (failure: unknown): void => setRefusal(textsOfFailure(failure));

  const whileBusy = (row: ResourceRow, action: Promise<void>): Promise<void> => {
    setRefusal([]);
    setBusyIds(busy => new Set(busy).add(row.id));

    return action
      .catch(refuse)
      .finally(() =>
        setBusyIds(busy => new Set([...busy].filter(busyId => busyId !== row.id)))
      );
  };

  const retry = (row: ResourceRow): void => {
    whileBusy(row, resources.retry(row));
  };

  const remove = (row: ResourceRow): void => {
    whileBusy(row, resources.delete(row)).finally(() => setToDelete(undefined));
  };

  return (
    <section aria-labelledby="library-heading">
      <h1 id="library-heading" className="text-3xl font-bold">
        Library
      </h1>
      <p className="mt-1 mb-4 text-muted-foreground">
        {resources.rows.length === 1
          ? '1 Resource'
          : `${resources.rows.length} Resources`}
      </p>
      <RefusalAlert texts={[...refusalOfTheList, ...refusal]} />
      {resources.rows.length === 0 ? (
        <EmptyState text="The library holds nothing yet." onUpload={onUpload} />
      ) : (
        <ResourceList
          rows={resources.rows}
          busyIds={busyIds}
          onRetry={retry}
          onDelete={setToDelete}
        />
      )}
      <DeleteResourceDialog
        row={toDelete}
        deleting={deleting}
        onConfirm={remove}
        onCancel={(): void => setToDelete(undefined)}
      />
    </section>
  );
};
