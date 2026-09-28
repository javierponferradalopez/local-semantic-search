import {screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {TextResult} from 'contract/TextResult';
import {Refusal} from '@/gateways/Refusal';
import type {SearchGateway} from '@/gateways/SearchGateway';
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

describe('SearchSection', () => {
  let search: MockProxy<SearchGateway>;

  beforeEach(() => {
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
    renderWithGateways(<SearchSection />, {search});

    await searchFor('  Animales ACUÁTICOS ');

    expect(search.search).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
  });

  it('should search nothing for a Query that holds only spaces', async () => {
    renderWithGateways(<SearchSection />, {search});

    await searchFor('   ');

    expect(search.search).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
  });

  it('should list the text Results under the header Text, in the order of the gateway', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the best.md'), aTextResult('the second.md')],
      images: []
    });

    renderWithGateways(<SearchSection />, {search});

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

    renderWithGateways(<SearchSection />, {search});

    await searchFor('the trip');

    expect(await screen.findByText('The text on page four.')).toBeDefined();
    expect(screen.getByRole('img', {name: 'PDF'})).toBeDefined();
    expect(screen.getByText(/Page 4/)).toBeDefined();
  });

  it('should show no page when the Content type has none', async () => {
    search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

    renderWithGateways(<SearchSection />, {search});

    await searchFor('the trip');

    expect(await screen.findByRole('img', {name: 'Markdown'})).toBeDefined();
    expect(screen.queryByText(/Page/)).toBeNull();
  });

  it('should open the fileUrl at its page in a new tab', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the manual.pdf', {contentType: 'pdf', page: 4})],
      images: []
    });

    renderWithGateways(<SearchSection />, {search});

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

    renderWithGateways(<SearchSection />, {search});

    await searchFor('the trip');

    const link = await screen.findByRole('link', {name: 'the notes.md'});

    expect(link.getAttribute('href')).toBe(fileUrl);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should say that nothing was found when the gateway gives no text Result', async () => {
    renderWithGateways(<SearchSection />, {search});

    await searchFor('the trip');

    expect(await screen.findByText('Nothing was found.')).toBeDefined();
  });

  it('should show the text of a Refusal, and never the failure itself', async () => {
    search.search.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    renderWithGateways(<SearchSection />, {search});

    await searchFor('the trip');

    expect(await screen.findByText('The server refused the value of "q".')).toBeDefined();
  });

  it('should remove the Results of the earlier Query when a Search fails', async () => {
    search.search
      .mockResolvedValueOnce({text: [aTextResult('the notes.md')], images: []})
      .mockRejectedValueOnce(new Refusal([{code: 'invalid_input', params: {path: 'q'}}]));

    renderWithGateways(<SearchSection />, {search});

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
      renderWithGateways(<SearchSection />, {search});

      await searchFor('the trip');

      const link = await screen.findByRole('button', {name: 'More in this file'});

      expect(link.textContent).toBe('More in this file');
      expect(document.body.textContent).not.toMatch(/passage|chunk/i);
    });

    it('should give the Resource and the Query of the Search to the gateway', async () => {
      renderWithGateways(<SearchSection />, {search});

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

      renderWithGateways(<SearchSection />, {search});

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

      renderWithGateways(<SearchSection />, {search});

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

      renderWithGateways(<SearchSection />, {search});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the notes.md'});

      expect(within(panel).getByRole('listitem').textContent).toBe('The best text.');
    });

    it('should show the text of a Refusal, and never the failure itself', async () => {
      search.matches.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection />, {search});

      await searchFor('the trip');
      await openMoreInThisFile();

      expect(
        await screen.findByText('The server refused the value of "q".')
      ).toBeDefined();
    });

    it('should ask the gateway once when the owner clicks twice before the answer', async () => {
      search.matches.mockReturnValue(new Promise(() => undefined));

      renderWithGateways(<SearchSection />, {search});

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

      renderWithGateways(<SearchSection />, {search});

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

      renderWithGateways(<SearchSection />, {search});

      await searchFor('the trip');
      await openMoreInThisFile();
      await screen.findByRole('alert');
      await openMoreInThisFile();

      expect(await screen.findByText('The best text.')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should close the panel when the owner searches another Query', async () => {
      search.matches.mockResolvedValue([{text: 'The best text.'}]);

      renderWithGateways(<SearchSection />, {search});

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
});
