import {isAnImageContentType} from 'contract/ContentType';
import {IMAGE_CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import type {ResourceRow} from 'contract/ResourceRow';
import {
  createContext,
  type JSX,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {useResourceGateway} from '@/config/GatewaysContext';
import {extensionOf} from '@/library/extensionOf';

// An action rejects with the failure of the gateway and leaves the list as it was.
export type Resources = {
  rows: ResourceRow[];
  // The rows that a create of this page load made, newest first. A reload forgets them.
  rowsOfThisSession: ResourceRow[];
  listFailure: unknown;
  create: (file: File) => Promise<void>;
  retry: (row: ResourceRow) => Promise<void>;
  delete: (row: ResourceRow) => Promise<void>;
};

const ResourcesContext = createContext<Resources | undefined>(undefined);

const POLL_INTERVAL_IN_MILLISECONDS = 2000;

const subscribeToVisibility = (onChange: () => void): (() => void) => {
  document.addEventListener('visibilitychange', onChange);

  return (): void => document.removeEventListener('visibilitychange', onChange);
};

const theTabIsVisible = (): boolean => document.visibilityState === 'visible';

type Props = {children: ReactNode};

export const ResourcesProvider = ({children}: Props): JSX.Element => {
  const gateway = useResourceGateway();
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [listFailure, setListFailure] = useState<unknown>();
  const [idsOfThisSession, setIdsOfThisSession] = useState<string[]>([]);
  // Each change sets a new object, so the poll runs again after each list, also when React batches its start and its end.
  const [listing, setListing] = useState({inFlight: true});
  const changedWhileListing = useRef(new Set<string>());
  const visible = useSyncExternalStore(subscribeToVisibility, theTabIsVisible);

  // A list sent before a create or a Retry holds an older row, so the row of the user wins (ADR-0039).
  const list = useCallback((): Promise<void> => {
    const changedIds = new Set<string>();
    setListing({inFlight: true});
    changedWhileListing.current = changedIds;

    return gateway
      .list()
      .then(listed => {
        setRows(current => {
          const changed = current.filter(({id}) => changedIds.has(id));

          return [
            ...changed.filter(row => !listed.some(({id}) => id === row.id)),
            ...listed.map(row => changed.find(({id}) => id === row.id) ?? row)
          ];
        });
        setListFailure(undefined);
      })
      .finally(() => setListing({inFlight: false}));
  }, [gateway]);

  useEffect(() => {
    list().catch(setListFailure);
  }, [list]);

  const polling = visible && rows.some(({ingestState}) => ingestState === 'ingesting');

  useEffect(() => {
    if (!polling || listing.inFlight) {
      return;
    }

    const tick = setTimeout(() => {
      list().catch(() => undefined);
    }, POLL_INTERVAL_IN_MILLISECONDS);

    return (): void => clearTimeout(tick);
  }, [polling, listing, list]);

  const create = async (file: File): Promise<void> => {
    const row = await (IMAGE_CONTENT_TYPE_BY_EXTENSION.has(extensionOf(file.name))
      ? gateway.createImageResource(file)
      : gateway.createTextResource(file));

    changedWhileListing.current.add(row.id);
    // A tick that ends before the create can already hold the row.
    setRows(listed => [row, ...listed.filter(({id}) => id !== row.id)]);
    setIdsOfThisSession(ids => [row.id, ...ids.filter(id => id !== row.id)]);
  };

  const retry = async ({id, contentType}: ResourceRow): Promise<void> => {
    const retried = await (isAnImageContentType(contentType)
      ? gateway.retryImageResource(id)
      : gateway.retryTextResource(id));

    changedWhileListing.current.add(id);
    setRows(listed => listed.map(row => (row.id === id ? retried : row)));
  };

  const deleteResource = async ({id, contentType}: ResourceRow): Promise<void> => {
    await (isAnImageContentType(contentType)
      ? gateway.deleteImageResource(id)
      : gateway.deleteTextResource(id));

    setRows(listed => listed.filter(row => row.id !== id));
  };

  const rowsOfThisSession = idsOfThisSession.flatMap(
    sessionId => rows.find(({id}) => id === sessionId) ?? []
  );

  return (
    <ResourcesContext
      value={{
        rows,
        rowsOfThisSession,
        listFailure,
        create,
        retry,
        delete: deleteResource
      }}
    >
      {children}
    </ResourcesContext>
  );
};

export const useResources = (): Resources => {
  const resources = useContext(ResourcesContext);

  if (resources === undefined) {
    throw new Error('The Resources are missing. The ResourcesProvider is not above.');
  }

  return resources;
};
