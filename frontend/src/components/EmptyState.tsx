import {Upload} from 'lucide-react';
import type {JSX} from 'react';
import {Button} from '@/components/ui/button';

type Props = {text: string; onUpload: () => void};

export const EmptyState = ({text, onUpload}: Props): JSX.Element => (
  <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
    <p className="text-muted-foreground">{text}</p>
    <Button type="button" variant="outline" onClick={onUpload}>
      <Upload />
      Upload a file
    </Button>
  </div>
);
