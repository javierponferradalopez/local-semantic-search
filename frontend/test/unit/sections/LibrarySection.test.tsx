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
