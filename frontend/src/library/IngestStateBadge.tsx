import type {IngestState} from 'contract/IngestState';
import {LoaderCircle} from 'lucide-react';
import type {JSX} from 'react';
import {Badge} from '@/components/ui/badge';
import {textOfIngestState} from '@/library/textOfIngestState';

type Props = {ingestState: IngestState};

export const IngestStateBadge = ({ingestState}: Props): JSX.Element => {
  const text = textOfIngestState(ingestState);

  switch (ingestState) {
    case 'ingesting':
      // The Ingest gives no progress (ADR-0018), so a spinner and no bar.
      return (
        <Badge variant="outline" role="status" aria-label={text}>
          <LoaderCircle className="animate-spin" />
          {text}
        </Badge>
      );
    case 'ready':
      return <Badge variant="secondary">{text}</Badge>;
    case 'failed':
      return <Badge variant="destructive">{text}</Badge>;
  }
};
