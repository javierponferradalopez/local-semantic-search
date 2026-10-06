import {Upload} from 'lucide-react';
import type {JSX} from 'react';
import {Button} from '@/components/ui/button';

type Props = {onClick: () => void};

export const UploadButton = ({onClick}: Props): JSX.Element => (
  <Button type="button" onClick={onClick}>
    <Upload />
    Upload
  </Button>
);
