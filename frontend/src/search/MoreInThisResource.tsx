import type {MatchRow} from 'contract/MatchRow';
import type {TextResult} from 'contract/TextResult';
import {type JSX, useState} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {Button} from '@/components/ui/button';
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
        <Button
          type="button"
          variant="link"
          className="mt-1 h-auto p-0"
          disabled={asking}
          onClick={open}
        >
          More in this file
        </Button>
      )}
      <RefusalAlert texts={refusal} />
      {matches?.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing more in this file for this search.
        </p>
      )}
      {matches !== undefined && matches.length > 0 && (
        <ol
          className="mt-2 space-y-2 border-l pl-4"
          aria-label={`More in ${result.name}`}
        >
          {matches.map(({text, page}, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two Chunks can hold the same text, and the list never changes its order.
            <li key={index}>
              {page !== undefined && (
                <a
                  href={hrefOf({fileUrl: result.fileUrl, page})}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Page {page}
                </a>
              )}
              <p className="line-clamp-3 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
};
