import {APP_NAME} from 'contract/AppName';
import {type JSX, useState} from 'react';
import {Link, NavLink, Route, Routes} from 'react-router';
import {UploadButton} from '@/components/UploadButton';
import {UploadDrawer} from '@/components/UploadDrawer';
import {LibrarySection} from '@/sections/LibrarySection';
import {SearchSection} from '@/sections/SearchSection';

export const App = (): JSX.Element => {
  // Above the routes, so that all of them open one drawer (ADR-0043).
  const [uploading, setUploading] = useState(false);
  const upload = (): void => setUploading(true);

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-240 items-center justify-between gap-4 p-4">
          <Link to="/" className="text-xl font-bold">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/library"
              className="text-sm font-medium text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline"
            >
              Library
            </NavLink>
            <UploadButton onClick={upload} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-240 p-4">
        <Routes>
          <Route path="/" element={<SearchSection onUpload={upload} />} />
          <Route path="/library" element={<LibrarySection onUpload={upload} />} />
        </Routes>
      </main>
      <UploadDrawer open={uploading} onOpenChange={setUploading} />
    </>
  );
};
