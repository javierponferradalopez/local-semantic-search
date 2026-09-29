import type {ResourceRow} from 'contract/ResourceRow';
import {type JSX, type MouseEvent, useState} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type Props = {
  row: ResourceRow | undefined;
  deleting: boolean;
  onConfirm: (row: ResourceRow) => void;
  onCancel: () => void;
};

export const DeleteResourceDialog = ({
  row,
  deleting,
  onConfirm,
  onCancel
}: Props): JSX.Element => {
  // The title keeps the name while the dialog fades out.
  const [named, setNamed] = useState(row);

  if (row !== undefined && row !== named) {
    setNamed(row);
  }

  const confirm = (event: MouseEvent): void => {
    // The dialog stays open until the gateway answers.
    event.preventDefault();

    if (row !== undefined) {
      onConfirm(row);
    }
  };

  return (
    <AlertDialog
      open={row !== undefined}
      onOpenChange={(open: boolean): void => {
        if (!open && !deleting) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {named?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the Resource, its File and everything the Ingest made from it.
            You cannot undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
