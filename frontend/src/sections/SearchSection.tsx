import type {TextResult} from 'contract/TextResult';
import {type ChangeEvent, type FormEvent, type JSX, useRef, useState} from 'react';
import {useSearchGateway} from '@/config/GatewaysContext';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {TextResultList} from '@/search/TextResultList';

export const SearchSection = (): JSX.Element => {
  const gateway = useSearchGateway();
  const [query, setQuery] = useState('');
  // The Query that gave the Results, which the box no longer holds once the owner types.
  const [searched, setSearched] = useState<{query: string; results: TextResult[]}>();
  const [refusal, setRefusal] = useState<string[]>([]);
  const latestSearch = useRef(0);

  const search = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (query.trim().length === 0) {
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
      {searched !== undefined && (
        <section aria-labelledby="text-results-heading">
          <h3 id="text-results-heading">Text</h3>
          <TextResultList key={searched.query} {...searched} />
        </section>
      )}
    </section>
  );
};
