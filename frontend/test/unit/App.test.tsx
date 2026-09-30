import {screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ResourceRow} from 'contract/ResourceRow';
import {App} from '@/App';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import {letTimePass} from '../utils/letTimePass';
import {type MockProxy, mock} from '../utils/mock';
import {renderWithGateways} from '../utils/renderWithGateways';

const rowNamed = (name: string): ResourceRow => ({
  id: name,
  name,
  contentType: 'markdown',
  ingestState: 'ready',
  createdAt: '2026-09-23T10:00:00.000Z',
  fileUrl: `/files/${name}`
});

describe('App', () => {
  let resources: MockProxy<ResourceGateway>;

  beforeEach(() => {
    resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([rowNamed('old.md')]);
  });

  const theLibrary = (): HTMLElement => screen.getByRole('region', {name: 'Library'});

  const recentNames = async (): Promise<string[]> =>
    within(await screen.findByRole('region', {name: 'Recently created'}))
      .getAllByRole('link')
      .map(link => link.textContent ?? '');

  it('should show a Resource that the owner creates in the Library and in Recently created', async () => {
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<App />, {resources});

    await waitFor(async () => expect(await recentNames()).toEqual(['old.md']));
    await userEvent.upload(
      screen.getByLabelText('Drop a file here, or pick one.'),
      new File(['a text'], 'new.md')
    );

    expect(await within(theLibrary()).findByRole('link', {name: 'new.md'})).toBeDefined();
    expect(await recentNames()).toEqual(['new.md', 'old.md']);
    expect(resources.list).toHaveBeenCalledOnce();
  });

  it('should take a Resource that the owner deletes out of the Library and of Recently created', async () => {
    resources.list.mockResolvedValue([rowNamed('notes.md'), rowNamed('old.md')]);
    resources.deleteTextResource.mockResolvedValue();

    renderWithGateways(<App />, {resources});

    await waitFor(async () =>
      expect(await recentNames()).toEqual(['notes.md', 'old.md'])
    );
    await userEvent.click(
      await within(theLibrary()).findByRole('button', {name: 'Delete notes.md'})
    );
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {name: 'Delete'})
    );

    await waitFor(() =>
      expect(within(theLibrary()).queryByRole('link', {name: 'notes.md'})).toBeNull()
    );
    expect(await recentNames()).toEqual(['old.md']);
    expect(resources.list).toHaveBeenCalledOnce();
  });

  describe('the poll', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show a Resource that the poll makes Ready the same in the Library and in Recently created', async () => {
      const thumbnailUrl = '/files/thumbnails/the beach.webp';
      const theBeach: ResourceRow = {
        ...rowNamed('the beach.png'),
        contentType: 'png',
        ingestState: 'ingesting'
      };
      resources.list
        .mockResolvedValueOnce([theBeach])
        .mockResolvedValue([{...theBeach, ingestState: 'ready', thumbnailUrl}]);

      renderWithGateways(<App />, {resources});

      await letTimePass(0);

      expect(within(theLibrary()).getByRole('status', {name: 'Ingesting'})).toBeDefined();

      await letTimePass(2000);

      const thumbnailOf = (element: HTMLElement): string | null | undefined =>
        element.querySelector('img')?.getAttribute('src');

      expect(within(theLibrary()).getByText('Ready')).toBeDefined();
      expect(
        thumbnailOf(within(theLibrary()).getByRole('row', {name: /the beach\.png/}))
      ).toBe(thumbnailUrl);
      expect(
        thumbnailOf(
          within(screen.getByRole('region', {name: 'Recently created'})).getByRole(
            'link',
            {name: 'the beach.png'}
          )
        )
      ).toBe(thumbnailUrl);
    });
  });
});
