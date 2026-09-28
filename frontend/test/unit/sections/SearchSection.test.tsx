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
});
