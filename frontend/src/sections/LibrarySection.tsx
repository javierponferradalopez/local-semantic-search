import type {ErrorItem} from 'contract/ErrorItem';
import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, useState} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {textsOfErrorItems} from '@/errors/textsOfErrorItems';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {DropZone} from '@/library/DropZone';
import {ResourceList} from '@/library/ResourceList';
import {useResources} from '@/resources/ResourcesContext';

export const LibrarySection = (): JSX.Element => {
  const resources = useResources();
  const [refusal, setRefusal] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  // It stays until a reload, because until then the Library does not hold the whole list.
  const refusalOfTheList =
    resources.listFailure === undefined ? [] : textsOfFailure(resources.listFailure);

  const refuse = (failure: unknown): void => setRefusal(textsOfFailure(failure));

  const create = (file: File): void => {
    setRefusal([]);
    resources.create(file).catch(refuse);
  };

  const retry = (row: ResourceRow): void => {
    setRefusal([]);
    setBusyIds(busy => new Set(busy).add(row.id));

    resources
      .retry(row)
      .catch(refuse)
      .finally(() =>
        setBusyIds(busy => new Set([...busy].filter(busyId => busyId !== row.id)))
      );
  };

  const remove = (row: ResourceRow): void => {
    setRefusal([]);
    resources.delete(row).catch(refuse);
  };

  return (
    <section aria-labelledby="library-heading">
      <h2 id="library-heading" className="mt-8 mb-4 text-2xl font-semibold">
        Library
      </h2>
      <DropZone
        onFile={create}
        onRefusal={(item: ErrorItem): void => setRefusal(textsOfErrorItems([item]))}
      />
      <RefusalAlert texts={[...refusalOfTheList, ...refusal]} />
      <ResourceList
        rows={resources.rows}
        busyIds={busyIds}
        onRetry={retry}
        onDelete={remove}
      />
    </section>
  );
};
