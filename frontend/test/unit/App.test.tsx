import {screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ResourceRow} from 'contract/ResourceRow';
import {App} from '@/App';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
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
});
