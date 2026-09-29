import type {MatchRow} from 'contract/MatchRow';
import type {TextResult} from 'contract/TextResult';
import {type JSX, useState} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {useSearchGateway} from '@/config/GatewaysContext';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {hrefOf} from '@/search/hrefOf';

type Props = {result: TextResult; query: string};

export const MoreInThisResource = ({result, query}: Props): JSX.Element => {
  const gateway = useSearchGateway();
  const [matches, setMatches] = useState<MatchRow[] | undefined>(undefined);
  const [refusal, setRefusal] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);

  const open = (): void => {
    setRefusal([]);
    setAsking(true);

    gateway
      .matches(result.resourceId, query)
      .then(setMatches)
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)))
      .finally(() => setAsking(false));
  };

  return (
    <>
      {matches === undefined && (
        <button
          type="button"
          className="more-in-this-file"
          disabled={asking}
          onClick={open}
        >
          More in this file
        </button>
      )}
      <RefusalAlert texts={refusal} />
      {matches !== undefined && (
        <ol className="matches" aria-label={`More in ${result.name}`}>
          {matches.map(({text, page}, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two Chunks can hold the same text, and the list never changes its order.
            <li key={index} className="match">
              {page !== undefined && (
                <a
                  href={hrefOf({fileUrl: result.fileUrl, page})}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Page {page}
                </a>
              )}
              <p className="text-result__text">{text}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
};
