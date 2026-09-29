import {APP_NAME} from 'contract/AppName';
import type {JSX} from 'react';
import {LibrarySection} from '@/sections/LibrarySection';
import {SearchSection} from '@/sections/SearchSection';

export const App = (): JSX.Element => (
  <main>
    <h1 className="mb-6 text-3xl font-bold">{APP_NAME}</h1>
    <LibrarySection />
    <SearchSection />
  </main>
);
