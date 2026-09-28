import type {ResourceRow} from 'contract/ResourceRow';
import type {TextResult} from 'contract/TextResult';
import {
  type ChangeEvent,
  type FormEvent,
  type JSX,
  useEffect,
  useRef,
  useState
} from 'react';
import {useResourceGateway, useSearchGateway} from '@/config/GatewaysContext';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {RecentResourceList} from '@/search/RecentResourceList';
import {TextResultList} from '@/search/TextResultList';

const RECENT_RESOURCES = 5;

export const SearchSection = (): JSX.Element => {
  const gateway = useSearchGateway();
  const resources = useResourceGateway();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ResourceRow[]>([]);
  // The Query that gave the Results, which the box no longer holds once the owner types.
  const [searched, setSearched] = useState<{query: string; results: TextResult[]}>();
  const [refusal, setRefusal] = useState<string[]>([]);
  const latestSearch = useRef(0);
  const boxIsEmpty = query.trim().length === 0;

  // Asked again each time the box is emptied, so a Resource created in the library shows.
  useEffect(() => {
    if (!boxIsEmpty) {
      return;
    }

    let current = true;

    resources
      .list()
      .then(rows => current && setRecent(rows.slice(0, RECENT_RESOURCES)))
      .catch((failure: unknown) => current && setRefusal(textsOfFailure(failure)));

    return (): void => {
      current = false;
    };
  }, [resources, boxIsEmpty]);

  const search = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (boxIsEmpty) {
      return;
    }

    const thisSearch = ++latestSearch.current;
    setRefusal([]);

    gateway
      .search(query)
      .then(({text}) => {
        if (thisSearch === latestSearch.current) {
          setSearched({query, results: text});
        }
      })
      .catch((failure: unknown) => {
        if (thisSearch === latestSearch.current) {
          setSearched(undefined);
          setRefusal(textsOfFailure(failure));
        }
      });
  };

  return (
    <section aria-labelledby="search-heading">
      <h2 id="search-heading">Search</h2>
      <search>
        <form onSubmit={search}>
          <input
            type="search"
            aria-label="Search"
            placeholder="Describe what you remember, like “the lighthouse on the Galician coast”"
            className="search-box"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setQuery(event.target.value)
            }
          />
        </form>
      </search>
      {refusal.length > 0 && (
        <ul className="refusal" role="alert">
          {refusal.map(text => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      {boxIsEmpty && <RecentResourceList rows={recent} />}
      {!boxIsEmpty && searched !== undefined && (
        <section aria-labelledby="text-results-heading">
          <h3 id="text-results-heading">Text</h3>
          <TextResultList key={searched.query} {...searched} />
        </section>
      )}
    </section>
  );
};
