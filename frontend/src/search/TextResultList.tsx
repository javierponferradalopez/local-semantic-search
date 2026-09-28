import type {TextResult} from 'contract/TextResult';
import type {JSX} from 'react';
import {ContentTypeIcon} from '@/search/ContentTypeIcon';

type Props = {results: TextResult[]};

// The fragment is presentation, so the browser adds it to the URL as it is (ADR-0012).
const hrefOf = ({fileUrl, page}: TextResult): string =>
  page === undefined ? fileUrl : `${fileUrl}#page=${page}`;

export const TextResultList = ({results}: Props): JSX.Element => {
  if (results.length === 0) {
    return <p>Nothing was found.</p>;
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
        </li>
      ))}
    </ol>
  );
};
