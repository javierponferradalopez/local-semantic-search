import {CircleAlert} from 'lucide-react';
import type {JSX} from 'react';
import {Alert, AlertDescription} from '@/components/ui/alert';

type Props = {texts: string[]};

export const RefusalAlert = ({texts}: Props): JSX.Element | null => {
  if (texts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="my-4">
      <CircleAlert />
      <AlertDescription>
        <ul>
          {texts.map((text, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two error items can give the same text, and the list never changes its order.
            <li key={index}>{text}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
