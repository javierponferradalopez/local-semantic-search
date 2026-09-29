import {type ContentType, IMAGE_CONTENT_TYPES} from 'contract/ContentType';
import {IMAGE_CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import type {ResourceRow} from 'contract/ResourceRow';
import {
  createContext,
  type JSX,
  type ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';
import {useResourceGateway} from '@/config/GatewaysContext';
import {extensionOf} from '@/library/extensionOf';

// An action rejects with the failure of the gateway and leaves the list as it was.
export type Resources = {
  rows: ResourceRow[];
  listFailure: unknown;
  create: (file: File) => Promise<void>;
  retry: (row: ResourceRow) => Promise<void>;
  delete: (row: ResourceRow) => Promise<void>;
};

const ResourcesContext = createContext<Resources | undefined>(undefined);

const isAnImage = (contentType: ContentType): boolean =>
  IMAGE_CONTENT_TYPES.some(imageType => imageType === contentType);

type Props = {children: ReactNode};

export const ResourcesProvider = ({children}: Props): JSX.Element => {
  const gateway = useResourceGateway();
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [listFailure, setListFailure] = useState<unknown>();

  useEffect(() => {
    // A Resource created before the list arrives stays, also when the list does not hold it.
    gateway
      .list()
      .then(listed =>
        setRows(created => [
          ...created.filter(row => !listed.some(({id}) => id === row.id)),
          ...listed
        ])
      )
      .catch(setListFailure);
  }, [gateway]);

  const create = async (file: File): Promise<void> => {
    const row = await (IMAGE_CONTENT_TYPE_BY_EXTENSION.has(extensionOf(file.name))
      ? gateway.createImageResource(file)
      : gateway.createTextResource(file));

    setRows(listed => [row, ...listed]);
  };

  const retry = async ({id, contentType}: ResourceRow): Promise<void> => {
    const retried = await (isAnImage(contentType)
      ? gateway.retryImageResource(id)
      : gateway.retryTextResource(id));

    setRows(listed => listed.map(row => (row.id === id ? retried : row)));
  };

  const deleteResource = async ({id, contentType}: ResourceRow): Promise<void> => {
    await (isAnImage(contentType)
      ? gateway.deleteImageResource(id)
      : gateway.deleteTextResource(id));

    setRows(listed => listed.filter(row => row.id !== id));
  };

  return (
    <ResourcesContext value={{rows, listFailure, create, retry, delete: deleteResource}}>
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
