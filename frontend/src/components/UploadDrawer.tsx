import type {ErrorItem} from 'contract/ErrorItem';
import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, useState} from 'react';
import {RefusalAlert} from '@/components/RefusalAlert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {textOfReason} from '@/errors/textOfReason';
import {textsOfErrorItems} from '@/errors/textsOfErrorItems';
import {textsOfFailure} from '@/errors/textsOfFailure';
import {DropZone} from '@/library/DropZone';
import {IngestStateBadge} from '@/library/IngestStateBadge';
import {useResources} from '@/resources/ResourcesContext';

type Props = {open: boolean; onOpenChange: (open: boolean) => void};

export const UploadDrawer = ({open, onOpenChange}: Props): JSX.Element => {
  const resources = useResources();
  const [refusal, setRefusal] = useState<string[]>([]);

  const create = (file: File): void => {
    setRefusal([]);
    resources
      .create(file)
      .catch((failure: unknown) => setRefusal(textsOfFailure(failure)));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-lg">Upload</SheetTitle>
          <SheetDescription>
            Each file that you upload becomes a Resource.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <DropZone
            onFile={create}
            onRefusal={(item: ErrorItem): void => setRefusal(textsOfErrorItems([item]))}
          />
          <RefusalAlert texts={refusal} />
          <ThisSession rows={resources.rowsOfThisSession} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ThisSession = ({rows}: {rows: ResourceRow[]}): JSX.Element | null => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="this-session-heading">
      <h3 id="this-session-heading" className="mt-6 mb-2 font-semibold">
        This session
      </h3>
      <ul className="divide-y">
        {rows.map(row => (
          <li key={row.id} className="py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{row.name}</span>
              <IngestStateBadge ingestState={row.ingestState} />
            </div>
            {row.reason !== undefined && (
              <p className="mt-1 text-destructive">{textOfReason(row.reason)}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
