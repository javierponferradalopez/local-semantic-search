import type {ContentType} from 'contract/ContentType';
import type {JSX} from 'react';

const ICON_OF: Record<ContentType, {symbol: string; label: string}> = {
  pdf: {symbol: '📕', label: 'PDF'},
  plain_text: {symbol: '📄', label: 'Plain text'},
  markdown: {symbol: '📝', label: 'Markdown'}
};

type Props = {contentType: ContentType};

export const ContentTypeIcon = ({contentType}: Props): JSX.Element => {
  const {symbol, label} = ICON_OF[contentType];

  return (
    <span role="img" aria-label={label} title={label}>
      {symbol}
    </span>
  );
};
