import type {TextResult} from 'contract/TextResult';
import type {JSX} from 'react';
import {ContentTypeIcon} from '@/search/ContentTypeIcon';
import {hrefOf} from '@/search/hrefOf';
import {MoreInThisResource} from '@/search/MoreInThisResource';

type Props = {results: TextResult[]; query: string};

export const TextResultList = ({results, query}: Props): JSX.Element => {
  if (results.length === 0) {
    return <p>No text was found.</p>;
  }

  return (
    <ol className="text-results">
      {results.map(result => (
        <li key={result.resourceId} className="text-result">
          <p className="text-result__citation">
            <ContentTypeIcon contentType={result.contentType} />{' '}
            <a href={hrefOf(result)} target="_blank" rel="noopener noreferrer">
              {result.name}
            </a>
            {result.page !== undefined && <span> · Page {result.page}</span>}
          </p>
          <p className="text-result__text">{result.text}</p>
          <MoreInThisResource result={result} query={query} />
        </li>
      ))}
    </ol>
  );
};
