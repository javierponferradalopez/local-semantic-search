import type {SearchResponse} from 'contract/SearchResponse';
import {LoaderCircle} from 'lucide-react';
import {
  type ChangeEvent,
  type FormEvent,
  type JSX,
  useEffect,
  useRef,
  useState
} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {Input} from '@/components/ui/input';
import {useSearchGateway} from '@/config/GatewaysContext';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {useResources} from '@/resources/ResourcesContext';
import {ImageResultGrid} from '@/search/ImageResultGrid';
import {RecentResourceList} from '@/search/RecentResourceList';
import {TextResultList} from '@/search/TextResultList';

const RECENT_RESOURCES = 5;
const MINIMUM_QUERY_LENGTH = 3;
const SEARCH_DELAY = 300;

const lengthOf = (value: string): number => value.trim().length;

export const SearchSection = (): JSX.Element => {
  const gateway = useSearchGateway();
  const {rows} = useResources();
  const [query, setQuery] = useState('');
  // The Query that gave the Results, which the box no longer holds once the owner types.
  const [searched, setSearched] = useState<{query: string; response: SearchResponse}>();
  const [refusal, setRefusal] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const latestSearch = useRef(0);
  // Trimmed, so that one Query never searches twice.
  const latestQuery = useRef<string>(undefined);
  const scheduledSearch = useRef<ReturnType<typeof setTimeout>>(undefined);
  const boxIsEmpty = lengthOf(query) === 0;

  useEffect(() => (): void => clearTimeout(scheduledSearch.current), []);

  const search = (value: string): void => {
    clearTimeout(scheduledSearch.current);

    if (lengthOf(value) < MINIMUM_QUERY_LENGTH || value.trim() === latestQuery.current) {
      return;
    }

    const thisSearch = ++latestSearch.current;
    latestQuery.current = value.trim();
    setRefusal([]);
    setSearching(true);

    gateway
      .search(value)
      .then(response => {
        if (thisSearch === latestSearch.current) {
          setSearched({query: value, response});
        }
      })
      .catch((failure: unknown) => {
        if (thisSearch === latestSearch.current) {
          // A refused Query can search again.
          latestQuery.current = undefined;
          setSearched(undefined);
          setRefusal(textsOfFailure(failure));
        }
      })
      .finally(() => {
        if (thisSearch === latestSearch.current) {
          setSearching(false);
        }
      });
  };

  const change = (value: string): void => {
    setQuery(value);
    clearTimeout(scheduledSearch.current);

    if (lengthOf(value) === 0) {
      // A late answer to a Query of the empty box must not bring its Results back.
      latestSearch.current++;
      latestQuery.current = undefined;
      setSearched(undefined);
      setRefusal([]);
      setSearching(false);
      return;
    }

    scheduledSearch.current = setTimeout(() => search(value), SEARCH_DELAY);
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    search(query);
  };

  return (
    <section aria-labelledby="search-heading">
      <h2 id="search-heading" className="mt-8 mb-4 text-2xl font-semibold">
        Search
      </h2>
      <search>
        <form onSubmit={submit} className="relative">
          <Input
            type="search"
            aria-label="Search"
            placeholder="Describe what you remember, like “the lighthouse on the Galician coast”"
            className="h-10 pr-10"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              change(event.target.value)
            }
          />
          {searching && (
            <LoaderCircle
              role="status"
              aria-label="Searching"
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </form>
      </search>
      <RefusalAlert texts={refusal} />
      {boxIsEmpty && <RecentResourceList rows={rows.slice(0, RECENT_RESOURCES)} />}
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
    return <p className="mt-6 text-muted-foreground">Nothing was found.</p>;
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
