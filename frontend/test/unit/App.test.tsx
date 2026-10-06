import {fireEvent, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {APP_NAME} from 'contract/AppName';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import type {ResourceRow} from 'contract/ResourceRow';
import {App} from '@/App';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import {letTimePass} from '../utils/letTimePass';
import {type MockProxy, mock} from '../utils/mock';
import {renderWithGateways} from '../utils/renderWithGateways';

const POLL_INTERVAL = 2000;

const rowNamed = (name: string): ResourceRow => ({
  id: name,
  name,
  contentType: 'markdown',
  ingestState: 'ready',
  createdAt: '2026-09-23T10:00:00.000Z',
  fileUrl: `/files/${name}`
});

const ingesting = (name: string): ResourceRow => ({
  ...rowNamed(name),
  ingestState: 'ingesting'
});

describe('App', () => {
  let resources: MockProxy<ResourceGateway>;

  beforeEach(() => {
    resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([rowNamed('old.md')]);
  });

  describe('the navigation', () => {
    it('should open the Library from its link, and mark the link as the current page', async () => {
      renderWithGateways(<App />, {resources});

      await userEvent.click(screen.getByRole('link', {name: 'Library'}));

      expect(screen.getByRole('heading', {level: 1, name: 'Library'})).toBeDefined();
      expect(
        screen.getByRole('link', {name: 'Library'}).getAttribute('aria-current')
      ).toBe('page');
      expect(screen.queryByRole('searchbox', {name: 'Search'})).toBeNull();
    });

    it('should go back to the Search from the app name', async () => {
      renderWithGateways(<App />, {resources}, {route: '/library'});

      await userEvent.click(screen.getByRole('link', {name: APP_NAME}));

      expect(screen.getByRole('searchbox', {name: 'Search'})).toBeDefined();
      expect(screen.queryByRole('heading', {name: 'Library'})).toBeNull();
      expect(
        screen.getByRole('link', {name: 'Library'}).hasAttribute('aria-current')
      ).toBe(false);
    });

    it('should open the Library from its address', async () => {
      renderWithGateways(<App />, {resources}, {route: '/library'});

      expect(
        await within(theLibrary()).findByRole('link', {name: 'old.md'})
      ).toBeDefined();
    });

    it('should give the Library no drop zone', async () => {
      renderWithGateways(<App />, {resources}, {route: '/library'});

      await within(theLibrary()).findByRole('link', {name: 'old.md'});

      expect(screen.queryByLabelText('Drop a file here, or pick one.')).toBeNull();
    });
  });

  describe('the upload drawer', () => {
    it.each(['/', '/library'])(
      'should open from the Upload button on %s',
      async route => {
        renderWithGateways(<App />, {resources}, {route});

        await openTheDrawer();

        expect(theDropZone()).toBeDefined();
      }
    );

    it.each([
      ['the close button', (): Promise<void> => userEvent.click(theCloseButton())],
      [
        'the Escape key',
        async (): Promise<void> => {
          await userEvent.keyboard('{Escape}');
        }
      ],
      [
        'a click outside it',
        (): Promise<void> =>
          userEvent.click(
            document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement
          )
      ]
    ])('should close with %s', async (_, close) => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await close();

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('should stay open after an upload', async () => {
      resources.createTextResource.mockResolvedValue(ingesting('new.md'));

      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('new.md'));

      expect(await within(thisSession()).findByText('new.md')).toBeDefined();
      expect(theDrawer()).toBeDefined();
    });

    it('should list the uploads of this session, newest first, with their Ingest state', async () => {
      resources.createTextResource
        .mockResolvedValueOnce(ingesting('first.md'))
        .mockResolvedValueOnce(ingesting('second.md'));

      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('first.md'));
      await within(theDrawer()).findByText('first.md');
      await userEvent.upload(theDropZone(), aFile('second.md'));
      await within(theDrawer()).findByText('second.md');

      const items = within(thisSession()).getAllByRole('listitem');

      expect(items.map(item => within(item).getByText(/\.md$/).textContent)).toEqual([
        'second.md',
        'first.md'
      ]);
      expect(
        within(items[0] as HTMLElement).getByRole('status', {name: 'Ingesting'})
      ).toBeDefined();
      expect(within(thisSession()).queryByText('old.md')).toBeNull();
    });

    it('should show the Reason of a Failed upload', async () => {
      resources.createTextResource.mockResolvedValue({
        ...rowNamed('scan.pdf'),
        ingestState: 'failed',
        reason: 'no_text_found'
      });

      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('scan.pdf'));

      expect(await within(thisSession()).findByText('Failed')).toBeDefined();
      expect(
        within(thisSession()).getByText('No text was found in this file.')
      ).toBeDefined();
    });

    it('should keep the uploads of this session when the drawer closes and opens again', async () => {
      resources.createTextResource.mockResolvedValue(ingesting('new.md'));

      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('new.md'));
      await within(thisSession()).findByText('new.md');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await openTheDrawer();

      expect(within(thisSession()).getByText('new.md')).toBeDefined();
    });

    it('should list nothing of this session before an upload', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();

      expect(
        within(theDrawer()).queryByRole('region', {name: 'This session'})
      ).toBeNull();
    });

    it('should take a Resource that the owner deletes out of this session', async () => {
      resources.createTextResource.mockResolvedValue(rowNamed('new.md'));
      resources.deleteTextResource.mockResolvedValue();

      renderWithGateways(<App />, {resources}, {route: '/library'});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('new.md'));
      await within(thisSession()).findByText('new.md');
      await userEvent.keyboard('{Escape}');
      await userEvent.click(
        await within(theLibrary()).findByRole('button', {name: 'Delete new.md'})
      );
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', {
          name: 'Delete'
        })
      );
      await waitFor(() =>
        expect(within(theLibrary()).queryByRole('link', {name: 'new.md'})).toBeNull()
      );
      await openTheDrawer();

      expect(within(theDrawer()).queryByText('new.md')).toBeNull();
    });
  });

  describe('the empty states', () => {
    beforeEach(() => {
      resources.list.mockResolvedValue([]);
    });

    it('should say on the Search that nothing is there yet, and open the drawer from its button', async () => {
      renderWithGateways(<App />, {resources});

      expect(await screen.findByText('Nothing is here yet.')).toBeDefined();

      await userEvent.click(screen.getByRole('button', {name: 'Upload a file'}));

      expect(theDropZone()).toBeDefined();
    });

    it('should say on the Library that it holds nothing yet, and open the drawer from its button', async () => {
      renderWithGateways(<App />, {resources}, {route: '/library'});

      expect(await screen.findByText('The library holds nothing yet.')).toBeDefined();

      await userEvent.click(screen.getByRole('button', {name: 'Upload a file'}));

      expect(theDropZone()).toBeDefined();
    });
  });

  it('should show an upload in Recently created and in the Library', async () => {
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<App />, {resources});

    await waitFor(async () => expect(await recentNames()).toEqual(['old.md']));
    await openTheDrawer();
    await userEvent.upload(theDropZone(), aFile('new.md'));
    await within(thisSession()).findByText('new.md');
    await userEvent.keyboard('{Escape}');

    await waitFor(async () => expect(await recentNames()).toEqual(['new.md', 'old.md']));

    await userEvent.click(screen.getByRole('link', {name: 'Library'}));

    expect(within(theLibrary()).getByRole('link', {name: 'new.md'})).toBeDefined();
    expect(resources.list).toHaveBeenCalledOnce();
  });

  it('should take a Resource that the owner deletes out of the Library and of Recently created', async () => {
    resources.list.mockResolvedValue([rowNamed('notes.md'), rowNamed('old.md')]);
    resources.deleteTextResource.mockResolvedValue();

    renderWithGateways(<App />, {resources}, {route: '/library'});

    await userEvent.click(
      await within(theLibrary()).findByRole('button', {name: 'Delete notes.md'})
    );
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {name: 'Delete'})
    );
    await waitFor(() =>
      expect(within(theLibrary()).queryByRole('link', {name: 'notes.md'})).toBeNull()
    );
    await userEvent.click(screen.getByRole('link', {name: APP_NAME}));

    expect(await recentNames()).toEqual(['old.md']);
    expect(resources.list).toHaveBeenCalledOnce();
  });

  it('should keep the refusal of the list in the Library when an upload is refused', async () => {
    resources.list.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );
    resources.createTextResource.mockRejectedValue(
      new Refusal([
        {
          code: 'duplicate_resource',
          params: {resourceId: 'an-id', name: 'notes.md', ingestState: 'ready'}
        }
      ])
    );

    renderWithGateways(<App />, {resources}, {route: '/library'});

    await screen.findByRole('alert');
    await openTheDrawer();
    await userEvent.upload(theDropZone(), aFile('notes.md'));
    await within(theDrawer()).findByRole('alert');
    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        within(screen.getByRole('alert'))
          .getAllByRole('listitem')
          .map(item => item.textContent)
      ).toEqual(['The server refused the value of "q".'])
    );
  });

  it('should keep a Resource that the owner creates before the list arrives', async () => {
    let giveTheList: (rows: ResourceRow[]) => void = () => undefined;
    resources.list.mockReturnValue(new Promise(resolve => (giveTheList = resolve)));
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<App />, {resources}, {route: '/library'});

    await openTheDrawer();
    await userEvent.upload(theDropZone(), aFile('new.md'));
    await within(thisSession()).findByText('new.md');
    await userEvent.keyboard('{Escape}');
    giveTheList([rowNamed('old.md')]);

    expect(await within(theLibrary()).findByText('old.md')).toBeDefined();
    expect(within(theLibrary()).getByText('new.md')).toBeDefined();
  });

  it('should show once a Resource that the owner creates before the list arrives, when the list holds it', async () => {
    let giveTheList: (rows: ResourceRow[]) => void = () => undefined;
    resources.list.mockReturnValue(new Promise(resolve => (giveTheList = resolve)));
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<App />, {resources}, {route: '/library'});

    await openTheDrawer();
    await userEvent.upload(theDropZone(), aFile('new.md'));
    await within(thisSession()).findByText('new.md');
    await userEvent.keyboard('{Escape}');
    giveTheList([rowNamed('new.md'), rowNamed('old.md')]);

    expect(await within(theLibrary()).findByText('old.md')).toBeDefined();
    expect(within(theLibrary()).getAllByText('new.md')).toHaveLength(1);
  });

  describe('the poll', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // The async wrapper of Testing Library waits on a timer that it advances only for the fake timers of Jest, so findBy and user-event hang here.

    it('should make an upload Ready in this session, in Recently created and in the Library', async () => {
      const thumbnailUrl = '/files/thumbnails/the beach.webp';
      const theBeach: ResourceRow = {...ingesting('the beach.png'), contentType: 'png'};
      resources.list
        .mockResolvedValueOnce([])
        .mockResolvedValue([{...theBeach, ingestState: 'ready', thumbnailUrl}]);
      resources.createImageResource.mockResolvedValue(theBeach);

      renderWithGateways(<App />, {resources});

      await letTimePass(0);
      fireEvent.click(screen.getByRole('button', {name: 'Upload'}));
      dropOnTheDropZone(aFile('the beach.png'));
      await letTimePass(0);

      expect(
        within(thisSession()).getByRole('status', {name: 'Ingesting'})
      ).toBeDefined();

      await letTimePass(POLL_INTERVAL);

      expect(within(thisSession()).getByText('Ready')).toBeDefined();

      fireEvent.keyDown(theDrawer(), {key: 'Escape'});
      await letTimePass(0);

      const thumbnailOf = (element: HTMLElement): string | null | undefined =>
        element.querySelector('img')?.getAttribute('src');

      expect(
        thumbnailOf(
          within(screen.getByRole('region', {name: 'Recently created'})).getByRole(
            'link',
            {name: 'the beach.png'}
          )
        )
      ).toBe(thumbnailUrl);

      fireEvent.click(screen.getByRole('link', {name: 'Library'}));
      await letTimePass(0);

      expect(within(theLibrary()).getByText('Ready')).toBeDefined();
      expect(
        thumbnailOf(within(theLibrary()).getByRole('row', {name: /the beach\.png/}))
      ).toBe(thumbnailUrl);
    });

    it('should start again when an upload makes a Resource Ingesting', async () => {
      resources.list.mockResolvedValue([]);
      resources.createTextResource.mockResolvedValue(ingesting('notes.md'));

      renderWithGateways(<App />, {resources});

      await letTimePass(POLL_INTERVAL);
      fireEvent.click(screen.getByRole('button', {name: 'Upload'}));
      dropOnTheDropZone(aFile('notes.md'));
      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should keep a Resource that the owner uploads while a tick is in flight', async () => {
      let giveTheTick: (rows: ResourceRow[]) => void = () => undefined;
      resources.list
        .mockResolvedValueOnce([ingesting('old.md')])
        .mockReturnValueOnce(new Promise(resolve => (giveTheTick = resolve)));
      resources.createTextResource.mockResolvedValue(ingesting('new.md'));

      renderWithGateways(<App />, {resources}, {route: '/library'});

      await letTimePass(POLL_INTERVAL);
      fireEvent.click(screen.getByRole('button', {name: 'Upload'}));
      dropOnTheDropZone(aFile('new.md'));
      await letTimePass(0);
      giveTheTick([rowNamed('old.md')]);
      await letTimePass(0);
      fireEvent.keyDown(theDrawer(), {key: 'Escape'});
      await letTimePass(0);

      expect(within(theLibrary()).getByText('old.md')).toBeDefined();
      expect(within(theLibrary()).getByText('new.md')).toBeDefined();
    });

    it('should show once a Resource that a tick holds before its upload ends', async () => {
      let endTheCreate: (row: ResourceRow) => void = () => undefined;
      resources.list
        .mockResolvedValueOnce([ingesting('old.md')])
        .mockResolvedValue([ingesting('new.md'), ingesting('old.md')]);
      resources.createTextResource.mockReturnValue(
        new Promise(resolve => (endTheCreate = resolve))
      );

      renderWithGateways(<App />, {resources}, {route: '/library'});

      await letTimePass(0);
      fireEvent.click(screen.getByRole('button', {name: 'Upload'}));
      dropOnTheDropZone(aFile('new.md'));
      await letTimePass(POLL_INTERVAL);
      endTheCreate(ingesting('new.md'));
      await letTimePass(0);
      fireEvent.keyDown(theDrawer(), {key: 'Escape'});
      await letTimePass(0);

      expect(within(theLibrary()).getAllByText('new.md')).toHaveLength(1);
    });

    it('should remove the refusal of the list when a tick succeeds', async () => {
      resources.list
        .mockRejectedValueOnce(
          new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
        )
        .mockResolvedValue([ingesting('notes.md'), rowNamed('old.md')]);
      resources.createTextResource.mockResolvedValue(ingesting('notes.md'));

      renderWithGateways(<App />, {resources}, {route: '/library'});

      await letTimePass(0);

      expect(screen.getByRole('alert')).toBeDefined();

      fireEvent.click(screen.getByRole('button', {name: 'Upload'}));
      dropOnTheDropZone(aFile('notes.md'));
      await letTimePass(POLL_INTERVAL);
      fireEvent.keyDown(theDrawer(), {key: 'Escape'});
      await letTimePass(0);

      expect(within(theLibrary()).getByText('old.md')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('the Gate', () => {
    beforeEach(() => {
      resources.list.mockResolvedValue([]);
      resources.createTextResource.mockResolvedValue(rowNamed('notes.md'));
    });

    it('should say what the drop zone takes, from the table of contract/', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();

      expect(
        within(theDrawer()).getByText(
          'It takes .pdf, .txt, .md, .jpg, .jpeg, .png, .webp, .gif, .avif or .svg, up to 50 MB.'
        )
      ).toBeDefined();
      expect(theDropZone().getAttribute('accept')).toBe(
        '.pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg'
      );
      expect(theDropZone().hasAttribute('multiple')).toBe(false);
    });

    it.each(['the beach.png', 'THE BEACH.JPG', 'the diagram.svg'])(
      'should send the image %j to the route of the images',
      async name => {
        resources.createImageResource.mockResolvedValue(rowNamed(name));

        renderWithGateways(<App />, {resources});

        await openTheDrawer();
        await userEvent.upload(theDropZone(), aFile(name));

        expect(await within(thisSession()).findByText(name)).toBeDefined();
        expect(resources.createImageResource).toHaveBeenCalledTimes(1);
        expect(resources.createTextResource).not.toHaveBeenCalled();
      }
    );

    it.each(['notes.md', 'manual.pdf', 'NOTES.TXT'])(
      'should send the text %j to the route of the texts',
      async name => {
        renderWithGateways(<App />, {resources});

        await openTheDrawer();
        await userEvent.upload(theDropZone(), aFile(name));

        await waitFor(() =>
          expect(resources.createTextResource).toHaveBeenCalledTimes(1)
        );
        expect(resources.createImageResource).not.toHaveBeenCalled();
      }
    );

    it.each(['the scan.tiff', 'the photo.heic'])(
      'should refuse %j, which the table does not hold, before the bytes travel',
      async name => {
        renderWithGateways(<App />, {resources});

        await openTheDrawer();
        dropOnTheDropZone(aFile(name));

        expect(await within(theDrawer()).findByRole('alert')).toBeDefined();
        expect(resources.createImageResource).not.toHaveBeenCalled();
        expect(resources.createTextResource).not.toHaveBeenCalled();
      }
    );

    it('should refuse a drop that names no Content type, before the bytes travel', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      dropOnTheDropZone(aFile('the notes.docx', {type: 'text/plain'}));

      expect(
        await within(theDrawer()).findByText(
          'The library cannot read "the notes.docx". Its extension names no Content type.'
        )
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should refuse a file above the limit, and give the size seen and the limit', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(
        theDropZone(),
        aFile('manual.pdf', {sizeInBytes: MAXIMUM_FILE_SIZE_IN_BYTES + 1})
      );

      expect(
        await within(theDrawer()).findByText(
          'The file is 50.1 MB, and the limit is 50 MB.'
        )
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should refuse several files, and say how many arrived', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      dropOnTheDropZone(aFile('a.md'), aFile('b.md'), aFile('c.md'));

      expect(
        await within(theDrawer()).findByText('3 files arrived. Drop one file at a time.')
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should show the text of a Refusal of the Gate, and never the failure itself', async () => {
      resources.createTextResource.mockRejectedValue(
        new Refusal([
          {
            code: 'duplicate_resource',
            params: {resourceId: 'an-id', name: 'notes.md', ingestState: 'ready'}
          }
        ])
      );

      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      await userEvent.upload(theDropZone(), aFile('notes.md'));

      expect(
        await within(theDrawer()).findByText(
          'These bytes are already in the library as "notes.md", which is Ready.'
        )
      ).toBeDefined();
    });

    it('should show the drop zone differently while a drag is over it', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();

      const zone = theDropZone().closest('label') as HTMLLabelElement;
      const atRest = zone.className;

      fireEvent.dragOver(zone);
      expect(zone.className).not.toBe(atRest);

      fireEvent.dragLeave(zone);
      expect(zone.className).toBe(atRest);

      fireEvent.dragOver(zone);
      fireEvent.drop(zone, {dataTransfer: {files: []}});
      expect(zone.className).toBe(atRest);
    });

    it('should keep the refusal until the next upload', async () => {
      renderWithGateways(<App />, {resources});

      await openTheDrawer();
      dropOnTheDropZone(aFile('a.md'), aFile('b.md'));

      expect(await within(theDrawer()).findByRole('alert')).toBeDefined();

      dropOnTheDropZone(aFile('notes.md'));

      expect(await within(theDrawer()).findByText('notes.md')).toBeDefined();
      expect(within(theDrawer()).queryByRole('alert')).toBeNull();
    });
  });
});

const theLibrary = (): HTMLElement => screen.getByRole('region', {name: 'Library'});

const theDrawer = (): HTMLElement => screen.getByRole('dialog', {name: 'Upload'});

const theDropZone = (): HTMLInputElement =>
  within(theDrawer()).getByLabelText<HTMLInputElement>('Drop a file here, or pick one.');

const thisSession = (): HTMLElement =>
  within(theDrawer()).getByRole('region', {name: 'This session'});

const theCloseButton = (): HTMLElement =>
  within(theDrawer()).getByRole('button', {name: 'Close'});

const openTheDrawer = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', {name: 'Upload'}));
  await screen.findByRole('dialog', {name: 'Upload'});
};

const recentNames = async (): Promise<string[]> =>
  within(await screen.findByRole('region', {name: 'Recently created'}))
    .getAllByRole('link')
    .map(link => link.textContent ?? '');

const dropOnTheDropZone = (...files: File[]): void => {
  fireEvent.drop(theDropZone(), {dataTransfer: {files}});
};

const aFile = (
  name: string,
  {type, sizeInBytes}: {type?: string; sizeInBytes?: number} = {}
): File => {
  const file = new File(['a text'], name, {type});

  if (sizeInBytes !== undefined) {
    Object.defineProperty(file, 'size', {value: sizeInBytes});
  }

  return file;
};
