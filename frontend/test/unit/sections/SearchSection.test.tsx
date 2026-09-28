import {screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ResourceRow} from 'contract/ResourceRow';
import type {TextResult} from 'contract/TextResult';
import {textOfReason} from '@/errors/textOfReason';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import type {SearchGateway} from '@/gateways/SearchGateway';
import {textOfIngestState} from '@/library/textOfIngestState';
import {SearchSection} from '@/sections/SearchSection';
import {type MockProxy, mock} from '../../utils/mock';
import {renderWithGateways} from '../../utils/renderWithGateways';

const aTextResult = (name: string, overrides: Partial<TextResult> = {}): TextResult => ({
  resourceId: name,
  name,
  contentType: 'markdown',
  text: `The text of ${name}.`,
  fileUrl: `/files/${name}`,
  ...overrides
});

const aResourceRow = (
  name: string,
  overrides: Partial<ResourceRow> = {}
): ResourceRow => ({
  id: name,
  name,
  contentType: 'markdown',
  ingestState: 'ready',
  createdAt: '2026-09-23T10:00:00.000Z',
  fileUrl: `/files/${name}`,
  ...overrides
});

describe('SearchSection', () => {
  let search: MockProxy<SearchGateway>;
  let resources: MockProxy<ResourceGateway>;

  beforeEach(() => {
    resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([]);
    search = mock<SearchGateway>();
    search.search.mockResolvedValue({text: [], images: []});
    search.matches.mockResolvedValue([]);
  });

  const searchFor = async (query: string): Promise<void> => {
    await userEvent.type(
      screen.getByRole('searchbox', {name: 'Search'}),
      `${query}{Enter}`
    );
  };

  it('should give the Query to the gateway exactly as the owner typed it', async () => {
    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('  Animales ACUÁTICOS ');

    expect(search.search).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
  });

  it('should search nothing for a Query that holds only spaces', async () => {
    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('   ');

    expect(search.search).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
  });

  it('should list the text Results under the header Text, in the order of the gateway', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the best.md'), aTextResult('the second.md')],
      images: []
    });

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    const group = await screen.findByRole('region', {name: 'Text'});
    const names = within(group)
      .getAllByRole('link')
      .map(link => link.textContent);

    expect(names).toStrictEqual(['the best.md', 'the second.md']);
    expect(screen.queryByRole('heading', {name: 'Images'})).toBeNull();
  });

  it('should show the icon of the Content type, the text of the Chunk and the page', async () => {
    search.search.mockResolvedValue({
      text: [
        aTextResult('the manual.pdf', {
          contentType: 'pdf',
          text: 'The text on page four.',
          page: 4
        })
      ],
      images: []
    });

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('The text on page four.')).toBeDefined();
    expect(screen.getByRole('img', {name: 'PDF'})).toBeDefined();
    expect(screen.getByText(/Page 4/)).toBeDefined();
  });

  it('should show no page when the Content type has none', async () => {
    search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByRole('img', {name: 'Markdown'})).toBeDefined();
    expect(screen.queryByText(/Page/)).toBeNull();
  });

  it('should open the fileUrl at its page in a new tab', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the manual.pdf', {contentType: 'pdf', page: 4})],
      images: []
    });

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    const link = await screen.findByRole('link', {name: 'the manual.pdf'});

    expect(link.getAttribute('href')).toBe('/files/the manual.pdf#page=4');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should open the fileUrl as it is when the Content type has no pages', async () => {
    const fileUrl = 'https://store.example/resources/an%20id/notes.md?signature=a';
    search.search.mockResolvedValue({
      text: [aTextResult('the notes.md', {fileUrl})],
      images: []
    });

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    const link = await screen.findByRole('link', {name: 'the notes.md'});

    expect(link.getAttribute('href')).toBe(fileUrl);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should say that nothing was found when the gateway gives no text Result', async () => {
    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('Nothing was found.')).toBeDefined();
  });

  it('should show the text of a Refusal, and never the failure itself', async () => {
    search.search.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('The server refused the value of "q".')).toBeDefined();
  });

  it('should remove the Results of the earlier Query when a Search fails', async () => {
    search.search
      .mockResolvedValueOnce({text: [aTextResult('the notes.md')], images: []})
      .mockRejectedValueOnce(new Refusal([{code: 'invalid_input', params: {path: 'q'}}]));

    renderWithGateways(<SearchSection />, {search, resources});

    await searchFor('the trip');
    await screen.findByRole('link', {name: 'the notes.md'});
    await searchFor(' again');
    await screen.findByRole('alert');

    expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
  });

  describe('More in this file', () => {
    beforeEach(() => {
      search.search.mockResolvedValue({
        text: [aTextResult('the manual.pdf', {resourceId: 'the id', contentType: 'pdf'})],
        images: []
      });
    });

    const openMoreInThisFile = async (): Promise<void> => {
      await userEvent.click(
        await screen.findByRole('button', {name: 'More in this file'})
      );
    };

    it('should show a link that carries no number, and say neither passage nor chunk', async () => {
      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');

      const link = await screen.findByRole('button', {name: 'More in this file'});

      expect(link.textContent).toBe('More in this file');
      expect(document.body.textContent).not.toMatch(/passage|chunk/i);
    });

    it('should give the Resource and the Query of the Search to the gateway', async () => {
      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), ' later');
      await openMoreInThisFile();

      expect(search.matches).toHaveBeenCalledWith('the id', 'the trip');
    });

    it('should list the Matches under the row, in the order of the gateway, with their page', async () => {
      search.matches.mockResolvedValue([
        {text: 'The best text.', page: 4},
        {text: 'The second text.', page: 2}
      ]);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the manual.pdf'});
      const rows = within(panel).getAllByRole('listitem');

      expect(rows.map(row => row.textContent)).toStrictEqual([
        'Page 4The best text.',
        'Page 2The second text.'
      ]);
    });

    it('should open the fileUrl at the page of each Match', async () => {
      search.matches.mockResolvedValue([{text: 'The best text.', page: 4}]);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const link = await screen.findByRole('link', {name: 'Page 4'});

      expect(link.getAttribute('href')).toBe('/files/the manual.pdf#page=4');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should show no page when the Content type has none', async () => {
      search.search.mockResolvedValue({
        text: [aTextResult('the notes.md', {resourceId: 'the id'})],
        images: []
      });
      search.matches.mockResolvedValue([{text: 'The best text.'}]);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the notes.md'});

      expect(within(panel).getByRole('listitem').textContent).toBe('The best text.');
    });

    it('should show the text of a Refusal, and never the failure itself', async () => {
      search.matches.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      expect(
        await screen.findByText('The server refused the value of "q".')
      ).toBeDefined();
    });

    it('should ask the gateway once when the owner clicks twice before the answer', async () => {
      search.matches.mockReturnValue(new Promise(() => undefined));

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();
      await openMoreInThisFile();

      expect(search.matches).toHaveBeenCalledTimes(1);
    });

    it('should show every Match, also two with the same text', async () => {
      search.matches.mockResolvedValue([
        {text: 'The same text.'},
        {text: 'The same text.'}
      ]);
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the manual.pdf'});

      expect(within(panel).getAllByRole('listitem')).toHaveLength(2);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });

    it('should remove the Refusal when the owner asks again, and show the Matches', async () => {
      search.matches
        .mockRejectedValueOnce(
          new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
        )
        .mockResolvedValueOnce([{text: 'The best text.'}]);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();
      await screen.findByRole('alert');
      await openMoreInThisFile();

      expect(await screen.findByText('The best text.')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should close the panel when the owner searches another Query', async () => {
      search.matches.mockResolvedValue([{text: 'The best text.'}]);

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();
      await screen.findByText('The best text.');
      await searchFor(' later');

      expect(
        await screen.findByRole('button', {name: 'More in this file'})
      ).toBeDefined();
      expect(screen.queryByText('The best text.')).toBeNull();
    });
  });

  describe('with an empty box', () => {
    const recentNames = async (): Promise<string[]> => {
      const heading = await screen.findByRole('heading', {name: 'Recently created'});
      const list = within(heading.closest('section') as HTMLElement);

      return list.getAllByRole('link').map(link => link.textContent ?? '');
    };

    it('should show the first five Resources that the gateway gives, in its order', async () => {
      resources.list.mockResolvedValue(
        ['6.md', '5.md', '4.md', '3.md', '2.md', '1.md'].map(name => aResourceRow(name))
      );

      renderWithGateways(<SearchSection />, {search, resources});

      expect(await recentNames()).toEqual(['6.md', '5.md', '4.md', '3.md', '2.md']);
    });

    it('should show each Resource as a file: its icon, a link to its fileUrl in a new tab and its createdAt', async () => {
      const fileUrl = 'https://store.example/resources/an%20id/manual.pdf?signature=a';
      resources.list.mockResolvedValue([
        aResourceRow('manual.pdf', {
          contentType: 'pdf',
          ingestState: 'failed',
          reason: 'unreadable_file',
          createdAt: '2026-09-24T08:30:00.000Z',
          fileUrl
        })
      ]);

      renderWithGateways(<SearchSection />, {search, resources});

      const link = await screen.findByRole('link', {name: 'manual.pdf'});
      const item = within(link.closest('li') as HTMLElement);

      expect(link.getAttribute('href')).toBe(fileUrl);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(item.getByRole('img', {name: 'PDF'})).toBeDefined();
      expect(
        (link.closest('li') as HTMLElement)
          .querySelector('time')
          ?.getAttribute('dateTime')
      ).toBe('2026-09-24T08:30:00.000Z');
      expect(item.queryByRole('button')).toBeNull();
      expect(item.queryByText(textOfIngestState('failed'), {exact: false})).toBeNull();
      expect(
        item.queryByText(textOfReason('unreadable_file'), {exact: false})
      ).toBeNull();
    });

    it('should show no recent heading when the gateway gives no Resource', async () => {
      renderWithGateways(<SearchSection />, {search, resources});

      await vi.waitFor(() => expect(resources.list).toHaveBeenCalledOnce());

      expect(screen.queryByRole('heading', {name: 'Recently created'})).toBeNull();
    });

    it('should hide the recent Resources when the box holds a Query, also when the text group is empty', async () => {
      resources.list.mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection />, {search, resources});

      await screen.findByRole('link', {name: 'notes.md'});
      await searchFor('the trip');
      await screen.findByText(/nothing/i);

      expect(screen.queryByRole('heading', {name: 'Recently created'})).toBeNull();
    });

    it('should hide the text Results when the owner empties the box', async () => {
      search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

      renderWithGateways(<SearchSection />, {search, resources});

      await searchFor('the trip');
      await screen.findByRole('link', {name: 'the notes.md'});
      await userEvent.clear(screen.getByRole('searchbox', {name: 'Search'}));

      expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
      expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
    });

    it('should show the recent Resources for a box that holds only spaces', async () => {
      resources.list.mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection />, {search, resources});

      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), '   ');

      expect(await recentNames()).toEqual(['notes.md']);
    });

    it('should ask the gateway again when the owner empties the box', async () => {
      resources.list
        .mockResolvedValueOnce([aResourceRow('old.md')])
        .mockResolvedValueOnce([aResourceRow('new.md'), aResourceRow('old.md')]);

      renderWithGateways(<SearchSection />, {search, resources});

      await screen.findByRole('link', {name: 'old.md'});
      const box = screen.getByRole('searchbox', {name: 'Search'});
      await userEvent.type(box, 'a');
      await userEvent.clear(box);

      expect(await screen.findByRole('link', {name: 'new.md'})).toBeDefined();
      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should not ask the gateway again while the owner types a Query', async () => {
      renderWithGateways(<SearchSection />, {search, resources});

      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), 'the trip');

      expect(resources.list).toHaveBeenCalledOnce();
    });

    it('should keep the newest answer when an older one comes after it', async () => {
      let giveTheOldAnswer: (rows: ResourceRow[]) => void = () => undefined;
      resources.list
        .mockReturnValueOnce(new Promise(resolve => (giveTheOldAnswer = resolve)))
        .mockResolvedValueOnce([aResourceRow('new.md')]);

      renderWithGateways(<SearchSection />, {search, resources});

      const box = screen.getByRole('searchbox', {name: 'Search'});
      await userEvent.type(box, 'a');
      await userEvent.clear(box);
      await screen.findByRole('link', {name: 'new.md'});
      giveTheOldAnswer([aResourceRow('old.md')]);

      await vi.waitFor(() =>
        expect(screen.queryByRole('link', {name: 'old.md'})).toBeNull()
      );
      expect(await recentNames()).toEqual(['new.md']);
    });

    it('should show the refusal when the gateway refuses the list', async () => {
      resources.list.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection />, {search, resources});

      expect(await screen.findByRole('alert')).toBeDefined();
    });

    it('should show no refusal when a refusal of an older list comes after the box holds a Query', async () => {
      let refuseTheList: (failure: unknown) => void = () => undefined;
      resources.list.mockReturnValueOnce(
        new Promise((_resolve, reject) => (refuseTheList = reject))
      );

      renderWithGateways(<SearchSection />, {search, resources});

      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), 'the trip');
      refuseTheList(new Refusal([{code: 'invalid_input', params: {path: 'q'}}]));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
