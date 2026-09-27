import {fireEvent, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import type {ResourceRow} from 'contract/ResourceRow';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import {LibrarySection} from '@/sections/LibrarySection';
import {type MockProxy, mock} from '../../utils/mock';
import {renderWithGateways} from '../../utils/renderWithGateways';

const rowNamed = (name: string): ResourceRow => ({
  id: name,
  name,
  contentType: 'markdown',
  ingestState: 'ingesting',
  createdAt: '2026-09-23T10:00:00.000Z',
  fileUrl: `/files/${name}`
});

describe('LibrarySection', () => {
  it('should list what the gateway gives', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([rowNamed('notes.md'), rowNamed('manual.pdf')]);

    renderWithGateways(<LibrarySection />, {resources});

    expect(await screen.findByText('notes.md')).toBeDefined();
    expect(screen.getByText('manual.pdf')).toBeDefined();
  });

  it('should make the name a link that opens the fileUrl, as it is, in a new tab', async () => {
    const resources = mock<ResourceGateway>();
    const fileUrl = 'https://store.example/resources/an%20id/notes.md?signature=a';
    resources.list.mockResolvedValue([{...rowNamed('notes.md'), fileUrl}]);

    renderWithGateways(<LibrarySection />, {resources});

    const link = await screen.findByRole('link', {name: 'notes.md'});

    expect(link.getAttribute('href')).toBe(fileUrl);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it.each([
    ['no_text_found', 'No text was found in this file.'],
    ['image_too_large', 'The image is too large.'],
    ['unreadable_file', 'The file could not be read.'],
    ['ingest_error', 'Something went wrong.']
  ] as const)(
    'should show the text of the Reason %s on a Failed row',
    async (reason, text) => {
      const resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([
        {...rowNamed('scan.pdf'), ingestState: 'failed', reason}
      ]);

      renderWithGateways(<LibrarySection />, {resources});

      expect(await screen.findByText(text)).toBeDefined();
    }
  );

  it('should show the text of a Refusal, and never the failure itself', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([]);
    resources.createTextResource.mockRejectedValue(
      new Refusal([
        {
          code: 'duplicate_resource',
          params: {resourceId: 'an-id', name: 'notes.md', ingestState: 'ready'}
        }
      ])
    );

    renderWithGateways(<LibrarySection />, {resources});

    await userEvent.upload(theDropZone(), aFile('notes.md'));

    expect(
      await screen.findByText(
        'These bytes are already in the library as "notes.md", which is Ready.'
      )
    ).toBeDefined();
  });

  describe('Delete', () => {
    let resources: MockProxy<ResourceGateway>;

    beforeEach(() => {
      resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([rowNamed('notes.md'), rowNamed('manual.pdf')]);
    });

    it('should take the row out of the list when the owner deletes it', async () => {
      resources.deleteTextResource.mockResolvedValue();

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      expect(resources.deleteTextResource).toHaveBeenCalledWith('notes.md');
      await waitFor(() => expect(screen.queryByText('notes.md')).toBeNull());
      expect(screen.getByText('manual.pdf')).toBeDefined();
    });

    it('should keep the row and show the text of a Refusal', async () => {
      resources.deleteTextResource.mockRejectedValue(
        new Refusal([{code: 'resource_not_found', params: {resourceId: 'notes.md'}}])
      );

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      expect(
        await screen.findByText(
          'The library no longer holds this Resource. Reload the page.'
        )
      ).toBeDefined();
      expect(screen.getByText('notes.md')).toBeDefined();
    });
  });

  describe('Retry', () => {
    let resources: MockProxy<ResourceGateway>;

    beforeEach(() => {
      resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([
        {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'},
        rowNamed('notes.md'),
        {...rowNamed('manual.pdf'), ingestState: 'ready'}
      ]);
    });

    it('should offer Retry on a Failed row alone, and Delete on every row', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      expect(await screen.findByRole('button', {name: 'Retry scan.pdf'})).toBeDefined();
      expect(screen.getAllByRole('button', {name: /^Retry /})).toHaveLength(1);
      expect(screen.getAllByRole('button', {name: /^Delete /})).toHaveLength(3);
    });

    it('should show the row that the gateway gives back, in Ingesting', async () => {
      resources.retryTextResource.mockResolvedValue(rowNamed('scan.pdf'));

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Retry scan.pdf'}));

      expect(resources.retryTextResource).toHaveBeenCalledWith('scan.pdf');
      await waitFor(() =>
        expect(screen.queryByRole('button', {name: 'Retry scan.pdf'})).toBeNull()
      );
      expect(screen.queryByText('Something went wrong.')).toBeNull();
      expect(screen.getAllByLabelText('Ingesting')).toHaveLength(2);
    });

    it('should block the actions of the row until the gateway answers', async () => {
      let answer: (row: ResourceRow) => void = () => {};
      resources.retryTextResource.mockReturnValue(
        new Promise(resolve => {
          answer = resolve;
        })
      );

      renderWithGateways(<LibrarySection />, {resources});

      const retry = await screen.findByRole('button', {name: 'Retry scan.pdf'});
      await userEvent.click(retry);
      await userEvent.click(retry);
      await userEvent.click(screen.getByRole('button', {name: 'Delete scan.pdf'}));

      expect(retry.hasAttribute('disabled')).toBe(true);
      expect(retry.textContent).toBe('Retrying…');
      expect(
        screen.getByRole('button', {name: 'Delete scan.pdf'}).hasAttribute('disabled')
      ).toBe(true);
      expect(
        screen.getByRole('button', {name: 'Delete notes.md'}).hasAttribute('disabled')
      ).toBe(false);
      expect(resources.retryTextResource).toHaveBeenCalledTimes(1);
      expect(resources.deleteTextResource).not.toHaveBeenCalled();

      answer(rowNamed('scan.pdf'));

      await waitFor(() =>
        expect(
          screen.getByRole('button', {name: 'Delete scan.pdf'}).hasAttribute('disabled')
        ).toBe(false)
      );
    });

    it('should remove the text of an earlier Refusal when a Retry succeeds', async () => {
      resources.retryTextResource
        .mockRejectedValueOnce(
          new Refusal([{code: 'resource_not_found', params: {resourceId: 'scan.pdf'}}])
        )
        .mockResolvedValueOnce(rowNamed('scan.pdf'));

      renderWithGateways(<LibrarySection />, {resources});

      const retry = await screen.findByRole('button', {name: 'Retry scan.pdf'});
      await userEvent.click(retry);
      await screen.findByRole('alert');
      await userEvent.click(retry);

      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    });

    it.each([
      [
        'resource_not_failed',
        {
          code: 'resource_not_failed',
          params: {resourceId: 'scan.pdf', ingestState: 'ingesting'}
        },
        'This Resource is Ingesting. Only a Failed Resource can be ingested again. Reload the page.'
      ],
      [
        'resource_not_found',
        {code: 'resource_not_found', params: {resourceId: 'scan.pdf'}},
        'The library no longer holds this Resource. Reload the page.'
      ]
    ] as const)(
      'should keep the row and show the text of the Refusal %s',
      async (_, item, text) => {
        resources.retryTextResource.mockRejectedValue(new Refusal([item]));

        renderWithGateways(<LibrarySection />, {resources});

        await userEvent.click(
          await screen.findByRole('button', {name: 'Retry scan.pdf'})
        );

        expect(await screen.findByText(text)).toBeDefined();
        await waitFor(() =>
          expect(
            screen.getByRole('button', {name: 'Retry scan.pdf'}).hasAttribute('disabled')
          ).toBe(false)
        );
      }
    );
  });

  describe('the Gate', () => {
    let resources: MockProxy<ResourceGateway>;

    beforeEach(() => {
      resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([]);
      resources.createTextResource.mockResolvedValue(rowNamed('notes.md'));
    });

    it('should say what the drop zone takes, from the table of contract/', () => {
      renderWithGateways(<LibrarySection />, {resources});

      expect(screen.getByText('It takes .pdf, .txt or .md, up to 50 MB.')).toBeDefined();
      expect(theDropZone().getAttribute('accept')).toBe('.pdf,.txt,.md');
      expect(theDropZone().hasAttribute('multiple')).toBe(false);
    });

    it('should refuse a drop that names no Content type, before the bytes travel', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      dropOnTheDropZone(aFile('the notes.docx', {type: 'text/plain'}));

      expect(
        await screen.findByText(
          'The library cannot read "the notes.docx". Its extension names no Content type.'
        )
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should refuse a file above the limit, and give the size seen and the limit', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.upload(
        theDropZone(),
        aFile('manual.pdf', {sizeInBytes: MAXIMUM_FILE_SIZE_IN_BYTES + 1})
      );

      expect(
        await screen.findByText('The file is 50.1 MB, and the limit is 50 MB.')
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should refuse several files, and say how many arrived', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      dropOnTheDropZone(aFile('a.md'), aFile('b.md'), aFile('c.md'));

      expect(
        await screen.findByText('3 files arrived. Drop one file at a time.')
      ).toBeDefined();
      expect(resources.createTextResource).not.toHaveBeenCalled();
    });

    it('should keep the refusal until the next action of the owner', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      dropOnTheDropZone(aFile('a.md'), aFile('b.md'));

      expect(await screen.findByRole('alert')).toBeDefined();

      dropOnTheDropZone(aFile('notes.md'));

      expect(await screen.findByText('notes.md')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});

const theDropZone = (): HTMLInputElement =>
  screen.getByLabelText<HTMLInputElement>('Drop a file here, or pick one.');

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
