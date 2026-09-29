import type {ResourceRow} from 'contract/ResourceRow';
import type {SearchResponse} from 'contract/SearchResponse';
import {
  type ChangeEvent,
  type FormEvent,
  type JSX,
  useEffect,
  useRef,
  useState
} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {useResourceGateway, useSearchGateway} from '@/config/GatewaysContext';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {ImageResultGrid} from '@/search/ImageResultGrid';
import {RecentResourceList} from '@/search/RecentResourceList';
import {TextResultList} from '@/search/TextResultList';

const RECENT_RESOURCES = 5;

export const SearchSection = (): JSX.Element => {
  const gateway = useSearchGateway();
  const resources = useResourceGateway();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ResourceRow[]>([]);
  // The Query that gave the Results, which the box no longer holds once the owner types.
  const [searched, setSearched] = useState<{query: string; response: SearchResponse}>();
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
      .then(response => {
        if (thisSearch === latestSearch.current) {
          setSearched({query, response});
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
      <h2 id="search-heading" className="mt-8 mb-4 text-2xl font-semibold">
        Search
      </h2>
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
      <RefusalAlert texts={refusal} />
      {boxIsEmpty && <RecentResourceList rows={recent} />}
      {!boxIsEmpty && searched !== undefined && <Groups {...searched} />}
    </section>
  );
};

// Stacked, text first, in a fixed order: an order by which group won compares two spaces.
const Groups = ({
  query,
  response: {text, images}
}: {
  query: string;
  response: SearchResponse;
}): JSX.Element => {
  if (text.length === 0 && images.length === 0) {
    return <p>Nothing was found.</p>;
  }

  return (
    <>
      <section aria-labelledby="text-results-heading">
        <h3 id="text-results-heading" className="mt-6 mb-2 text-lg font-semibold">
          Text
        </h3>
        <TextResultList key={query} results={text} query={query} />
      </section>
      <section aria-labelledby="image-results-heading">
        <h3 id="image-results-heading" className="mt-6 mb-2 text-lg font-semibold">
          Images
        </h3>
        <ImageResultGrid results={images} />
      </section>
    </>
  );
};
