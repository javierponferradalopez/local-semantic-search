import {act, fireEvent, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ImageResult} from 'contract/ImageResult';
import type {ResourceRow} from 'contract/ResourceRow';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import {textOfReason} from '@/errors/textOfReason';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import type {SearchGateway} from '@/gateways/SearchGateway';
import {textOfIngestState} from '@/library/textOfIngestState';
import {SearchSection} from '@/sections/SearchSection';
import {letTimePass} from '../../utils/letTimePass';
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

const anImageResult = (
  name: string,
  overrides: Partial<ImageResult> = {}
): ImageResult => ({
  resourceId: name,
  name,
  fileUrl: `/files/${name}`,
  thumbnailUrl: `/files/thumbnails/${name}.webp`,
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
    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('  Animales ACUÁTICOS ');

    expect(search.search).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
  });

  it('should search nothing for a Query that holds only spaces', async () => {
    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('   ');

    expect(search.search).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
  });

  it('should list the text Results under the header Text, in the order of the gateway', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the best.md'), aTextResult('the second.md')],
      images: []
    });

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    const group = await screen.findByRole('region', {name: 'Text'});
    const names = within(group)
      .getAllByRole('link')
      .map(link => link.textContent);

    expect(names).toStrictEqual(['the best.md', 'the second.md']);
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

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('The text on page four.')).toBeDefined();
    expect(screen.getByRole('img', {name: 'PDF'})).toBeDefined();
    expect(screen.getByText(/Page 4/)).toBeDefined();
  });

  it('should show no page when the Content type has none', async () => {
    search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByRole('img', {name: 'Markdown'})).toBeDefined();
    expect(screen.queryByText(/Page/)).toBeNull();
  });

  it('should open the fileUrl at its page in a new tab', async () => {
    search.search.mockResolvedValue({
      text: [aTextResult('the manual.pdf', {contentType: 'pdf', page: 4})],
      images: []
    });

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

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

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    const link = await screen.findByRole('link', {name: 'the notes.md'});

    expect(link.getAttribute('href')).toBe(fileUrl);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('should say once that nothing was found, in place of both groups, when both are empty', async () => {
    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('Nothing was found.')).toBeDefined();
    expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
    expect(screen.queryByRole('heading', {name: 'Images'})).toBeNull();
  });

  describe('Images', () => {
    it('should show the images under the header Images, in the order of the gateway', async () => {
      search.search.mockResolvedValue({
        text: [],
        images: [anImageResult('the best.png'), anImageResult('the second.png')]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');

      const group = await screen.findByRole('region', {name: 'Images'});
      const names = within(group)
        .getAllByRole('link')
        .map(link => link.textContent);

      expect(names).toStrictEqual(['the best.png', 'the second.png']);
    });

    it('should show the thumbnail inside an img, with the name of the File', async () => {
      search.search.mockResolvedValue({
        text: [],
        images: [anImageResult('the beach.svg', {thumbnailUrl: '/files/the beach.webp'})]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');

      const link = await screen.findByRole('link', {name: 'the beach.svg'});
      const thumbnail = link.querySelector('img');

      expect(thumbnail?.getAttribute('src')).toBe('/files/the beach.webp');
      expect(thumbnail?.getAttribute('alt')).toBe('');
    });

    it('should open the fileUrl as it is, with no fragment, in a new tab', async () => {
      const fileUrl = 'https://store.example/resources/an%20id/beach.png?signature=a';
      search.search.mockResolvedValue({
        text: [],
        images: [anImageResult('the beach.png', {fileUrl})]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');

      const link = await screen.findByRole('link', {name: 'the beach.png'});

      expect(link.getAttribute('href')).toBe(fileUrl);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should show no More in this file link', async () => {
      search.search.mockResolvedValue({
        text: [],
        images: [anImageResult('the beach.png')]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');
      await screen.findByRole('link', {name: 'the beach.png'});

      expect(screen.queryByRole('button', {name: 'More in this file'})).toBeNull();
    });

    it('should show two images with the same name', async () => {
      search.search.mockResolvedValue({
        text: [],
        images: [
          anImageResult('the beach.png', {resourceId: 'the first'}),
          anImageResult('the beach.png', {resourceId: 'the second'})
        ]
      });
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');

      const group = await screen.findByRole('region', {name: 'Images'});

      expect(within(group).getAllByRole('link')).toHaveLength(2);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });

    it('should show the Text group first and the Images group second', async () => {
      search.search.mockResolvedValue({
        text: [aTextResult('the notes.md')],
        images: [anImageResult('the beach.png')]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');
      await screen.findByRole('region', {name: 'Images'});

      expect(
        screen.getAllByRole('heading', {level: 3}).map(heading => heading.textContent)
      ).toStrictEqual(['Text', 'Images']);
    });

    it('should keep the Images group with its own empty message when only the text group has Results', async () => {
      search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');

      const group = await screen.findByRole('region', {name: 'Images'});

      expect(within(group).getByText('No image was found.')).toBeDefined();
      expect(screen.queryByText('Nothing was found.')).toBeNull();
    });

    it('should keep the Text group with its own empty message when only the Images group has Results', async () => {
      search.search.mockResolvedValue({
        text: [],
        images: [anImageResult('the beach.png')]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('a beach');

      const group = await screen.findByRole('region', {name: 'Text'});

      expect(within(group).getByText('No text was found.')).toBeDefined();
      expect(screen.queryByText('Nothing was found.')).toBeNull();
    });
  });

  it('should show the text of a Refusal, and never the failure itself', async () => {
    search.search.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

    await searchFor('the trip');

    expect(await screen.findByText('The server refused the value of "q".')).toBeDefined();
  });

  it('should remove the Results of the earlier Query when a Search fails', async () => {
    search.search
      .mockResolvedValueOnce({text: [aTextResult('the notes.md')], images: []})
      .mockRejectedValueOnce(new Refusal([{code: 'invalid_input', params: {path: 'q'}}]));

    renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

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
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');

      const link = await screen.findByRole('button', {name: 'More in this file'});

      expect(link.textContent).toBe('More in this file');
      expect(document.body.textContent).not.toMatch(/passage|chunk/i);
    });

    it('should give the Resource and the Query of the Search to the gateway', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      // The scheduled search of the new Query never answers, so the Results stay those of the old one.
      search.search.mockReturnValue(new Promise(() => undefined));
      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), ' later');
      await openMoreInThisFile();

      expect(search.matches).toHaveBeenCalledWith('the id', 'the trip');
    });

    it('should list the Matches under the row, in the order of the gateway, with their page', async () => {
      search.matches.mockResolvedValue([
        {text: 'The best text.', page: 4},
        {text: 'The second text.', page: 2}
      ]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the manual.pdf'});
      const rows = within(panel).getAllByRole('listitem');

      expect(rows.map(row => row.textContent)).toStrictEqual([
        'Page 4The best text.',
        'Page 2The second text.'
      ]);
    });

    it('should say that there is nothing more when the gateway gives no Match', async () => {
      search.matches.mockResolvedValue([]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      expect(
        await screen.findByText('Nothing more in this file for this search.')
      ).toBeDefined();
      expect(screen.queryByRole('list', {name: 'More in the manual.pdf'})).toBeNull();
      expect(screen.queryByRole('button', {name: 'More in this file'})).toBeNull();
    });

    it('should open the fileUrl at the page of each Match', async () => {
      search.matches.mockResolvedValue([{text: 'The best text.', page: 4}]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

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

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      const panel = await screen.findByRole('list', {name: 'More in the notes.md'});

      expect(within(panel).getByRole('listitem').textContent).toBe('The best text.');
    });

    it('should show the text of a Refusal, and never the failure itself', async () => {
      search.matches.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      expect(
        await screen.findByText('The server refused the value of "q".')
      ).toBeDefined();
    });

    it('should ask the gateway once when the owner clicks twice before the answer', async () => {
      search.matches.mockReturnValue(new Promise(() => undefined));

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();
      await openMoreInThisFile();

      expect(search.matches).toHaveBeenCalledTimes(1);
    });

    it('should show the text of a Refusal of the Matches in the alert', async () => {
      search.matches.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();

      expect(
        within(await screen.findByRole('alert')).getByText(
          'The server refused the value of "q".'
        )
      ).toBeDefined();
    });

    it('should show every Match, also two with the same text', async () => {
      search.matches.mockResolvedValue([
        {text: 'The same text.'},
        {text: 'The same text.'}
      ]);
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

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

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await openMoreInThisFile();
      await screen.findByRole('alert');
      await openMoreInThisFile();

      expect(await screen.findByText('The best text.')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should close the panel when the owner searches another Query', async () => {
      search.matches.mockResolvedValue([{text: 'The best text.'}]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

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

  describe('as the owner types', () => {
    const SEARCH_DELAY = 300;
    const POLL_INTERVAL = 2000;

    type PendingSearch = {
      promise: Promise<SearchResponse>;
      resolve: (response: SearchResponse) => void;
      reject: (failure: unknown) => void;
    };

    const aPendingSearch = (): PendingSearch => {
      let resolve: PendingSearch['resolve'] = () => undefined;
      let reject: PendingSearch['reject'] = () => undefined;
      const promise = new Promise<SearchResponse>((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
      });

      return {promise, resolve, reject};
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const box = (): HTMLElement => screen.getByRole('searchbox', {name: 'Search'});

    // The async wrapper of Testing Library waits on a timer that it advances only for the fake timers of Jest, so user-event hangs here.
    const typeInTheBox = (value: string): void => {
      fireEvent.change(box(), {target: {value}});
    };

    const pushEnter = (): void => {
      fireEvent.submit(box());
    };

    const wait = async (milliseconds: number): Promise<void> => {
      await act(() => vi.advanceTimersByTimeAsync(milliseconds));
    };

    it('should search nothing while the Query, without its spaces at the ends, has fewer than 3 characters', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('  ab ');
      pushEnter();
      await wait(SEARCH_DELAY);

      expect(search.search).not.toHaveBeenCalled();
    });

    it('should search once, 300 ms after the last keystroke, with the Query as the owner typed it', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox(' the trip');
      await wait(SEARCH_DELAY - 1);

      expect(search.search).not.toHaveBeenCalled();

      await wait(1);

      expect(search.search).toHaveBeenCalledOnce();
      expect(search.search).toHaveBeenCalledWith(' the trip');
    });

    it('should cancel the scheduled search when the owner types again', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the');
      await wait(SEARCH_DELAY - 100);
      typeInTheBox('the trip');
      await wait(SEARCH_DELAY - 1);

      expect(search.search).not.toHaveBeenCalled();

      await wait(1);

      expect(search.search).toHaveBeenCalledOnce();
      expect(search.search).toHaveBeenCalledWith('the trip');
    });

    it('should search at once on Enter, and cancel the scheduled search', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      pushEnter();

      expect(search.search).toHaveBeenCalledOnce();

      await wait(SEARCH_DELAY);

      expect(search.search).toHaveBeenCalledOnce();
    });

    it('should not search again when the poll changes the list of Resources', async () => {
      resources.list
        .mockResolvedValueOnce([aResourceRow('notes.md', {ingestState: 'ingesting'})])
        .mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      pushEnter();
      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
      expect(search.search).toHaveBeenCalledOnce();
    });

    it('should not search again on Enter for the Query that the scheduled search searched', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      pushEnter();

      expect(search.search).toHaveBeenCalledOnce();
    });

    it('should not search again for the same Query with other spaces at its ends', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox(' the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('the trip ');
      await wait(SEARCH_DELAY);

      expect(search.search).toHaveBeenCalledOnce();
    });

    it('should search again on Enter for a Query that was refused', async () => {
      search.search.mockRejectedValueOnce(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      pushEnter();

      expect(search.search).toHaveBeenCalledTimes(2);
    });

    it('should keep the last Results while the Query has 1 or 2 characters', async () => {
      search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('th');
      await wait(SEARCH_DELAY);

      expect(search.search).toHaveBeenCalledOnce();
      expect(screen.getByRole('link', {name: 'the notes.md'})).toBeDefined();
    });

    it('should remove the Results and show the recent Resources when the owner empties the box', async () => {
      resources.list.mockResolvedValue([aResourceRow('recent.md')]);
      search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('');

      expect(screen.getByRole('heading', {name: 'Recently created'})).toBeDefined();

      typeInTheBox('th');

      expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
    });

    it('should show no late answer of a search when the owner empties the box before it arrives', async () => {
      const pending = aPendingSearch();
      search.search.mockReturnValue(pending.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('');
      typeInTheBox('th');
      await act(async () =>
        pending.resolve({text: [aTextResult('the notes.md')], images: []})
      );

      expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
      expect(screen.queryByRole('status', {name: 'Searching'})).toBeNull();
    });

    it('should show a spinner in the box while a search is in progress, and remove it when its answer arrives', async () => {
      const pending = aPendingSearch();
      search.search.mockReturnValue(pending.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      expect(screen.queryByRole('status', {name: 'Searching'})).toBeNull();

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);

      expect(screen.getByRole('status', {name: 'Searching'})).toBeDefined();

      await act(async () => pending.resolve({text: [], images: []}));

      expect(screen.queryByRole('status', {name: 'Searching'})).toBeNull();
    });

    it('should remove the spinner when the search is refused', async () => {
      const pending = aPendingSearch();
      search.search.mockReturnValue(pending.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      await act(async () =>
        pending.reject(new Refusal([{code: 'invalid_input', params: {path: 'q'}}]))
      );

      expect(screen.queryByRole('status', {name: 'Searching'})).toBeNull();
    });

    it('should keep the answer to the newest Query when the answer to an older Query arrives later', async () => {
      const older = aPendingSearch();
      const newer = aPendingSearch();
      search.search.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('the trip later');
      await wait(SEARCH_DELAY);
      await act(async () =>
        newer.resolve({text: [aTextResult('the newer.md')], images: []})
      );
      await act(async () =>
        older.resolve({text: [aTextResult('the older.md')], images: []})
      );

      expect(screen.getByRole('link', {name: 'the newer.md'})).toBeDefined();
      expect(screen.queryByRole('link', {name: 'the older.md'})).toBeNull();
    });

    it('should keep the spinner while the newest search is in progress, also when an older answer arrives', async () => {
      const older = aPendingSearch();
      const newer = aPendingSearch();
      search.search.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('the trip later');
      await wait(SEARCH_DELAY);
      await act(async () => older.resolve({text: [], images: []}));

      expect(screen.getByRole('status', {name: 'Searching'})).toBeDefined();
    });

    it('should show the text of a Refusal of a scheduled search in the alert', async () => {
      search.search.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);

      expect(
        within(screen.getByRole('alert')).getByText(
          'The server refused the value of "q".'
        )
      ).toBeDefined();
    });

    it('should search a Query of exactly 3 characters without its spaces at the ends', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('  abc ');
      await wait(SEARCH_DELAY);

      expect(search.search).toHaveBeenCalledWith('  abc ');
    });

    it('should search the same Query again after the owner empties the box, and show its Results', async () => {
      search.search.mockResolvedValue({text: [aTextResult('the notes.md')], images: []});

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('');
      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);

      expect(search.search).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('link', {name: 'the notes.md'})).toBeDefined();
    });

    it('should remove the Refusal when the owner empties the box', async () => {
      search.search.mockRejectedValue(
        new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
      );

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('');

      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should show no late answer of a search when the owner fills the box with only spaces before it arrives', async () => {
      const pending = aPendingSearch();
      search.search.mockReturnValue(pending.promise);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      typeInTheBox('the trip');
      await wait(SEARCH_DELAY);
      typeInTheBox('   ');
      typeInTheBox('th');
      await act(async () =>
        pending.resolve({text: [aTextResult('the notes.md')], images: []})
      );

      expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
    });

    it('should search nothing when the section goes before the scheduled search', async () => {
      const {unmount} = renderWithGateways(<SearchSection onUpload={vi.fn()} />, {
        search,
        resources
      });

      typeInTheBox('the trip');
      unmount();
      await wait(SEARCH_DELAY);

      expect(search.search).not.toHaveBeenCalled();
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

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      expect(await recentNames()).toEqual(['6.md', '5.md', '4.md', '3.md', '2.md']);
    });

    it('should show each Resource as a card: a link to its fileUrl in a new tab, with no Ingest state and no action', async () => {
      const fileUrl = 'https://store.example/resources/an%20id/manual.pdf?signature=a';
      resources.list.mockResolvedValue([
        aResourceRow('manual.pdf', {
          contentType: 'pdf',
          ingestState: 'failed',
          reason: 'unreadable_file',
          fileUrl
        })
      ]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      const link = await screen.findByRole('link', {name: 'manual.pdf'});
      const item = within(link.closest('li') as HTMLElement);

      expect(link.getAttribute('href')).toBe(fileUrl);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(item.queryByRole('button')).toBeNull();
      expect(item.queryByText(textOfIngestState('failed'), {exact: false})).toBeNull();
      expect(
        item.queryByText(textOfReason('unreadable_file'), {exact: false})
      ).toBeNull();
    });

    it('should show the thumbnail of an Image Resource that has one', async () => {
      resources.list.mockResolvedValue([
        aResourceRow('the beach.png', {
          contentType: 'png',
          thumbnailUrl: '/files/thumbnails/the beach.webp'
        })
      ]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      const link = await screen.findByRole('link', {name: 'the beach.png'});

      expect(link.querySelector('img')?.getAttribute('src')).toBe(
        '/files/thumbnails/the beach.webp'
      );
    });

    it.each([
      ['a Text Resource', 'manual.pdf', 'pdf', 'PDF'],
      ['an Image Resource with no thumbnail yet', 'the beach.png', 'png', 'PNG']
    ] as const)(
      'should show a large icon of the Content type in place of the thumbnail, for %s',
      async (_, name, contentType, label) => {
        resources.list.mockResolvedValue([aResourceRow(name, {contentType})]);

        renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

        const link = await screen.findByRole('link', {name});

        expect(link.querySelector('img')).toBeNull();
        expect(within(link).getByRole('img', {name: label, hidden: true})).toBeDefined();
      }
    );

    it('should show no recent heading when the gateway gives no Resource', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await vi.waitFor(() => expect(resources.list).toHaveBeenCalledOnce());

      expect(screen.queryByRole('heading', {name: 'Recently created'})).toBeNull();
    });

    it('should hide the recent Resources when the box holds a Query, also when the text group is empty', async () => {
      resources.list.mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await screen.findByRole('link', {name: 'notes.md'});
      await searchFor('the trip');
      await screen.findByText('Nothing was found.');

      expect(screen.queryByRole('heading', {name: 'Recently created'})).toBeNull();
    });

    it('should hide both groups when the owner empties the box', async () => {
      search.search.mockResolvedValue({
        text: [aTextResult('the notes.md')],
        images: [anImageResult('the beach.png')]
      });

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await searchFor('the trip');
      await screen.findByRole('link', {name: 'the notes.md'});
      await userEvent.clear(screen.getByRole('searchbox', {name: 'Search'}));

      expect(screen.queryByRole('heading', {name: 'Text'})).toBeNull();
      expect(screen.queryByRole('heading', {name: 'Images'})).toBeNull();
      expect(screen.queryByRole('link', {name: 'the notes.md'})).toBeNull();
    });

    it('should show the recent Resources for a box that holds only spaces', async () => {
      resources.list.mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), '   ');

      expect(await recentNames()).toEqual(['notes.md']);
    });

    it('should not ask the gateway again when the owner empties the box', async () => {
      resources.list.mockResolvedValue([aResourceRow('notes.md')]);

      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await screen.findByRole('link', {name: 'notes.md'});
      const box = screen.getByRole('searchbox', {name: 'Search'});
      await userEvent.type(box, 'a');
      await userEvent.clear(box);

      expect(await recentNames()).toEqual(['notes.md']);
      expect(resources.list).toHaveBeenCalledOnce();
    });

    it('should not ask the gateway again while the owner types a Query', async () => {
      renderWithGateways(<SearchSection onUpload={vi.fn()} />, {search, resources});

      await userEvent.type(screen.getByRole('searchbox', {name: 'Search'}), 'the trip');

      expect(resources.list).toHaveBeenCalledOnce();
    });
  });
});
