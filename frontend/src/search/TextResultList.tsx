import type {TextResult} from 'contract/TextResult';
import type {JSX} from 'react';
import {ContentTypeIcon} from '@/search/ContentTypeIcon';
import {hrefOf} from '@/search/hrefOf';
import {MoreInThisResource} from '@/search/MoreInThisResource';

type Props = {results: TextResult[]; query: string};

export const TextResultList = ({results, query}: Props): JSX.Element => {
  if (results.length === 0) {
    return <p className="text-muted-foreground">No text was found.</p>;
  }

  return (
    <ol className="divide-y">
      {results.map(result => (
        <li key={result.resourceId} className="py-3">
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <ContentTypeIcon contentType={result.contentType} />
            <a
              href={hrefOf(result)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {result.name}
            </a>
            {result.page !== undefined && (
              <span className="font-normal text-muted-foreground">
                {' '}
                · Page {result.page}
              </span>
            )}
          </p>
          <p className="line-clamp-3 text-muted-foreground">{result.text}</p>
          <MoreInThisResource result={result} query={query} />
        </li>
      ))}
    </ol>
  );
};
