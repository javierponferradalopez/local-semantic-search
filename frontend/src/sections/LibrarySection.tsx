import type {ErrorItem} from 'contract/ErrorItem';
import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, useEffect, useState} from 'react';
import {useResourceGateway} from '@/config/GatewaysContext';
import {textsOfErrorItems} from '@/errors/textsOfErrorItems';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {DropZone} from '@/library/DropZone';
import {ResourceList} from '@/library/ResourceList';

export const LibrarySection = (): JSX.Element => {
  const resources = useResourceGateway();
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [refusal, setRefusal] = useState<string[]>([]);

  useEffect(() => {
    resources
      .list()
      .then(setRows)
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)));
  }, [resources]);

  const create = (file: File): void => {
    setRefusal([]);

    resources
      .createTextResource(file)
      .then(row => setRows(listed => [row, ...listed]))
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
      <ResourceList rows={rows} />
    </section>
  );
};
