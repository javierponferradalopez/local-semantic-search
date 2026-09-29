import {IMAGE_CONTENT_TYPES} from 'contract/ContentType';
import {IMAGE_CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import type {ErrorItem} from 'contract/ErrorItem';
import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, useEffect, useState} from 'react';
import {useResourceGateway} from '@/config/GatewaysContext';
import {textsOfErrorItems} from '@/errors/textsOfErrorItems';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {DropZone} from '@/library/DropZone';
import {extensionOf} from '@/library/extensionOf';
import {ResourceList} from '@/library/ResourceList';

export const LibrarySection = (): JSX.Element => {
  const resources = useResourceGateway();
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [refusal, setRefusal] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    resources
      .list()
      .then(setRows)
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)));
  }, [resources]);

  const create = (file: File): void => {
    setRefusal([]);

    const created = IMAGE_CONTENT_TYPE_BY_EXTENSION.has(extensionOf(file.name))
      ? resources.createImageResource(file)
      : resources.createTextResource(file);

    created
      .then(row => setRows(listed => [row, ...listed]))
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)));
  };

  const retry = ({id}: ResourceRow): void => {
    setRefusal([]);
    setBusyIds(busy => new Set(busy).add(id));

    resources
      .retryTextResource(id)
      .then(retried =>
        setRows(listed => listed.map(row => (row.id === id ? retried : row)))
      )
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)))
      .finally(() =>
        setBusyIds(busy => new Set([...busy].filter(busyId => busyId !== id)))
      );
  };

  const remove = ({id, contentType}: ResourceRow): void => {
    setRefusal([]);

    const deleted = IMAGE_CONTENT_TYPES.some(imageType => imageType === contentType)
      ? resources.deleteImageResource(id)
      : resources.deleteTextResource(id);

    deleted
      .then(() => setRows(listed => listed.filter(row => row.id !== id)))
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)));
  };

  return (
    <section aria-labelledby="library-heading">
      <h2 id="library-heading">Library</h2>
      <DropZone
        onFile={create}
        onRefusal={(item: ErrorItem): void => setRefusal(textsOfErrorItems([item]))}
      />
      {refusal.length > 0 && (
        <ul className="refusal" role="alert">
          {refusal.map(text => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      <ResourceList rows={rows} busyIds={busyIds} onRetry={retry} onDelete={remove} />
    </section>
  );
};
