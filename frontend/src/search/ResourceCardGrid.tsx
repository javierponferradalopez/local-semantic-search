import type {JSX, ReactNode} from 'react';

type Props = {children: ReactNode};

// Shared, so a Resource has one look in every list.
export const ResourceCardGrid = ({children}: Props): JSX.Element => (
  <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
    {children}
  </ul>
);
