import {act, fireEvent, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import type {ResourceRow} from 'contract/ResourceRow';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import {LibrarySection} from '@/sections/LibrarySection';
import {letTimePass} from '../../utils/letTimePass';
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

  it('should tell an image from a text by its Content type', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([
      {...rowNamed('the beach.png'), contentType: 'png'},
      rowNamed('notes.md')
    ]);

    renderWithGateways(<LibrarySection />, {resources});

    expect(await screen.findByRole('cell', {name: 'png'})).toBeDefined();
    expect(screen.getByRole('cell', {name: 'markdown'})).toBeDefined();
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

  it('should give the creation date as a machine-readable time', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([rowNamed('notes.md')]);

    renderWithGateways(<LibrarySection />, {resources});

    const cell = await screen.findByRole('cell', {name: /2026/});

    expect(cell.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-09-23T10:00:00.000Z'
    );
  });

  describe('the column at the left of the name', () => {
    const firstCellOf = async (name: string): Promise<HTMLElement> => {
      const row = await screen.findByRole('row', {name: new RegExp(name)});

      return within(row).getAllByRole('cell')[0] as HTMLElement;
    };

    it('should come before the name, and keep the Content type column', async () => {
      const resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([rowNamed('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await screen.findByText('notes.md');

      expect(
        screen.getAllByRole('columnheader').map(header => header.textContent)
      ).toStrictEqual([
        'Preview',
        'Name',
        'Content type',
        'Ingest state',
        'Created',
        'Actions'
      ]);
    });

    it('should show the thumbnail of an Image Resource that has one', async () => {
      const resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([
        {
          ...rowNamed('the beach.png'),
          contentType: 'png',
          ingestState: 'ready',
          thumbnailUrl: '/files/thumbnails/the beach.webp'
        }
      ]);

      renderWithGateways(<LibrarySection />, {resources});

      const thumbnail = (await firstCellOf('the beach.png')).querySelector('img');

      expect(thumbnail?.getAttribute('src')).toBe('/files/thumbnails/the beach.webp');
      expect(thumbnail?.getAttribute('alt')).toBe('');
    });

    it('should show the icon of the Content type of a Text Resource', async () => {
      const resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([{...rowNamed('manual.pdf'), contentType: 'pdf'}]);

      renderWithGateways(<LibrarySection />, {resources});

      const cell = await firstCellOf('manual.pdf');

      expect(within(cell).getByRole('img', {name: 'PDF'})).toBeDefined();
      expect(cell.querySelector('img')).toBeNull();
    });

    it('should show the image icon for an Image Resource that has no thumbnail yet', async () => {
      const resources = mock<ResourceGateway>();
      resources.list.mockResolvedValue([
        {...rowNamed('the beach.png'), contentType: 'png'}
      ]);

      renderWithGateways(<LibrarySection />, {resources});

      const cell = await firstCellOf('the beach.png');

      expect(within(cell).getByRole('img', {name: 'PNG'})).toBeDefined();
      expect(cell.querySelector('img')).toBeNull();
    });
  });

  it('should show the Ingest state of each row as a badge', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([
      rowNamed('notes.md'),
      {...rowNamed('manual.pdf'), ingestState: 'ready'},
      {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'}
    ]);

    renderWithGateways(<LibrarySection />, {resources});

    const rowOf = async (name: string): Promise<HTMLElement> =>
      screen.findByRole('row', {name: new RegExp(name)});

    expect(
      within(await rowOf('notes.md')).getByRole('status', {name: 'Ingesting'})
    ).toBeDefined();
    expect(within(await rowOf('manual.pdf')).getByText('Ready')).toBeDefined();
    expect(within(await rowOf('scan.pdf')).getByText('Failed')).toBeDefined();
    expect(
      within(await rowOf('scan.pdf')).getByText('Something went wrong.')
    ).toBeDefined();
  });

  it('should give Ready a neutral badge and Failed a destructive badge', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([
      {...rowNamed('manual.pdf'), ingestState: 'ready'},
      {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'}
    ]);

    renderWithGateways(<LibrarySection />, {resources});

    expect((await screen.findByText('Ready')).getAttribute('data-variant')).toBe(
      'secondary'
    );
    expect(screen.getByText('Failed').getAttribute('data-variant')).toBe('destructive');
  });

  it('should show a spinner in the badge of an Ingesting row alone', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([
      rowNamed('notes.md'),
      {...rowNamed('manual.pdf'), ingestState: 'ready'}
    ]);

    renderWithGateways(<LibrarySection />, {resources});

    const ingesting = await screen.findByRole('status', {name: 'Ingesting'});

    expect(ingesting.querySelector('svg.animate-spin')).not.toBeNull();
    expect(screen.getByText('Ready').querySelector('svg')).toBeNull();
  });

  it('should say that the library holds nothing when the gateway gives no row', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockResolvedValue([]);

    renderWithGateways(<LibrarySection />, {resources});

    expect(await screen.findByText('The library holds nothing yet.')).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
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

  it('should show the refusal when the gateway refuses the list', async () => {
    const resources = mock<ResourceGateway>();
    resources.list.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    renderWithGateways(<LibrarySection />, {resources});

    expect(
      within(await screen.findByRole('alert')).getByText(
        'The server refused the value of "q".'
      )
    ).toBeDefined();
  });

  it('should keep the refusal of the list when a later action of the owner is refused', async () => {
    const resources = mock<ResourceGateway>();
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

    renderWithGateways(<LibrarySection />, {resources});

    await screen.findByRole('alert');
    await userEvent.upload(theDropZone(), aFile('notes.md'));

    await waitFor(() =>
      expect(
        within(screen.getByRole('alert'))
          .getAllByRole('listitem')
          .map(item => item.textContent)
      ).toEqual([
        'The server refused the value of "q".',
        'These bytes are already in the library as "notes.md", which is Ready.'
      ])
    );
  });

  it('should keep a Resource that the owner creates before the list arrives', async () => {
    const resources = mock<ResourceGateway>();
    let giveTheList: (rows: ResourceRow[]) => void = () => undefined;
    resources.list.mockReturnValue(new Promise(resolve => (giveTheList = resolve)));
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<LibrarySection />, {resources});

    await userEvent.upload(theDropZone(), aFile('new.md'));
    await screen.findByText('new.md');
    giveTheList([rowNamed('old.md')]);

    expect(await screen.findByText('old.md')).toBeDefined();
    expect(screen.getByText('new.md')).toBeDefined();
  });

  it('should show once a Resource that the owner creates before the list arrives, when the list holds it', async () => {
    const resources = mock<ResourceGateway>();
    let giveTheList: (rows: ResourceRow[]) => void = () => undefined;
    resources.list.mockReturnValue(new Promise(resolve => (giveTheList = resolve)));
    resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

    renderWithGateways(<LibrarySection />, {resources});

    await userEvent.upload(theDropZone(), aFile('new.md'));
    await screen.findByText('new.md');
    giveTheList([rowNamed('new.md'), rowNamed('old.md')]);

    expect(await screen.findByText('old.md')).toBeDefined();
    expect(screen.getAllByText('new.md')).toHaveLength(1);
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

    it('should ask in a dialog, and remove nothing before the owner confirms', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      expect(await screen.findByRole('alertdialog')).toBeDefined();
      expect(resources.deleteTextResource).not.toHaveBeenCalled();
      expect(screen.getByText('notes.md')).toBeDefined();
    });

    it('should name the Resource, and say that the delete cannot be undone', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      const dialog = await screen.findByRole('alertdialog', {name: 'Delete notes.md?'});

      expect(
        within(dialog).getByText(
          'This removes the Resource, its File and everything the Ingest made from it. You cannot undo this.'
        )
      ).toBeDefined();
    });

    it('should give the focus to Cancel, and close on Cancel without a call to the gateway', async () => {
      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      const cancel = within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Cancel'
      });

      expect(document.activeElement).toBe(cancel);

      await userEvent.click(cancel);

      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      expect(resources.deleteTextResource).not.toHaveBeenCalled();
      expect(resources.deleteImageResource).not.toHaveBeenCalled();
      expect(screen.getByText('notes.md')).toBeDefined();
    });

    it('should give the Delete of the dialog the destructive variant, and disable it while the gateway answers', async () => {
      let answer: () => void = () => {};
      resources.deleteTextResource.mockReturnValue(
        new Promise(resolve => {
          answer = resolve;
        })
      );

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Delete notes.md'}));

      const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Delete'
      });

      expect(confirm.getAttribute('data-variant')).toBe('destructive');

      await userEvent.click(confirm);
      await userEvent.click(confirm);

      expect(confirm.hasAttribute('disabled')).toBe(true);
      expect(screen.getByRole('alertdialog')).toBeDefined();
      expect(resources.deleteTextResource).toHaveBeenCalledTimes(1);

      answer();

      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    });

    it('should keep the dialog open and the row busy until the gateway answers', async () => {
      let answer: () => void = () => {};
      resources.deleteTextResource.mockReturnValue(
        new Promise(resolve => {
          answer = resolve;
        })
      );

      renderWithGateways(<LibrarySection />, {resources});

      await deleteAndConfirm('notes.md');
      await userEvent.keyboard('{Escape}');

      expect(screen.getByRole('alertdialog', {name: 'Delete notes.md?'})).toBeDefined();
      expect(
        screen
          .getByRole('row', {name: /notes\.md/, hidden: true})
          .getAttribute('aria-busy')
      ).toBe('true');

      answer();

      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    });

    it('should take the row out of the list and close the dialog when the owner confirms', async () => {
      resources.deleteTextResource.mockResolvedValue();

      renderWithGateways(<LibrarySection />, {resources});

      await deleteAndConfirm('notes.md');

      expect(resources.deleteTextResource).toHaveBeenCalledWith('notes.md');
      await waitFor(() => expect(screen.queryByText('notes.md')).toBeNull());
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.getByText('manual.pdf')).toBeDefined();
    });

    it('should send the deletion of an image to the route of the images', async () => {
      resources.list.mockResolvedValue([
        {...rowNamed('the beach.png'), contentType: 'png'},
        rowNamed('notes.md')
      ]);
      resources.deleteImageResource.mockResolvedValue();

      renderWithGateways(<LibrarySection />, {resources});

      await deleteAndConfirm('the beach.png');

      expect(resources.deleteImageResource).toHaveBeenCalledWith('the beach.png');
      expect(resources.deleteTextResource).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByText('the beach.png')).toBeNull());
      expect(screen.getByText('notes.md')).toBeDefined();
    });

    it('should remove the text of an earlier Refusal when a Delete succeeds', async () => {
      resources.deleteTextResource
        .mockRejectedValueOnce(
          new Refusal([{code: 'resource_not_found', params: {resourceId: 'notes.md'}}])
        )
        .mockResolvedValueOnce();

      renderWithGateways(<LibrarySection />, {resources});

      await deleteAndConfirm('notes.md');
      await screen.findByRole('alert');
      await deleteAndConfirm('notes.md');

      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    });

    it('should close the dialog, keep the row and show the text of a Refusal', async () => {
      resources.deleteTextResource.mockRejectedValue(
        new Refusal([{code: 'resource_not_found', params: {resourceId: 'notes.md'}}])
      );

      renderWithGateways(<LibrarySection />, {resources});

      await deleteAndConfirm('notes.md');

      expect(
        within(await screen.findByRole('alert')).getByText(
          'The library no longer holds this Resource. Reload the page.'
        )
      ).toBeDefined();
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      expect(screen.getByText('notes.md')).toBeDefined();
    });

    it('should let the owner confirm a Delete while a Retry of another row runs', async () => {
      resources.list.mockResolvedValue([
        {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'},
        rowNamed('notes.md')
      ]);
      resources.retryTextResource.mockReturnValue(new Promise(() => {}));
      resources.deleteTextResource.mockResolvedValue();

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Retry scan.pdf'}));
      await userEvent.click(screen.getByRole('button', {name: 'Delete notes.md'}));

      const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Delete'
      });

      expect(confirm.hasAttribute('disabled')).toBe(false);

      await userEvent.click(confirm);

      expect(resources.deleteTextResource).toHaveBeenCalledWith('notes.md');
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    });

    it('should keep the name in the title while the dialog fades out', async () => {
      const fadeOut = theDialogFadesOut();

      try {
        renderWithGateways(<LibrarySection />, {resources});

        await userEvent.click(
          await screen.findByRole('button', {name: 'Delete notes.md'})
        );
        await userEvent.click(
          within(await screen.findByRole('alertdialog')).getByRole('button', {
            name: 'Cancel'
          })
        );

        const closing = screen.getByRole('alertdialog', {hidden: true});

        expect(closing.getAttribute('data-state')).toBe('closed');
        expect(within(closing).getByRole('heading', {hidden: true}).textContent).toBe(
          'Delete notes.md?'
        );
      } finally {
        fadeOut.mockRestore();
      }
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
      expect(screen.getAllByRole('status', {name: 'Ingesting'})).toHaveLength(2);
    });

    it('should send the Retry of an image to the route of the images', async () => {
      resources.list.mockResolvedValue([
        {
          ...rowNamed('the beach.png'),
          contentType: 'png',
          ingestState: 'failed',
          reason: 'image_too_large'
        }
      ]);
      resources.retryImageResource.mockResolvedValue({
        ...rowNamed('the beach.png'),
        contentType: 'png'
      });

      renderWithGateways(<LibrarySection />, {resources});

      expect(await screen.findByText('The image is too large.')).toBeDefined();

      await userEvent.click(screen.getByRole('button', {name: 'Retry the beach.png'}));

      expect(resources.retryImageResource).toHaveBeenCalledWith('the beach.png');
      expect(resources.retryTextResource).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.queryByRole('button', {name: 'Retry the beach.png'})).toBeNull()
      );
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
      expect(screen.getByRole('row', {name: /scan\.pdf/}).getAttribute('aria-busy')).toBe(
        'true'
      );
      expect(screen.getByRole('row', {name: /notes\.md/}).getAttribute('aria-busy')).toBe(
        'false'
      );
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

    it('should ask nothing before a Retry', async () => {
      resources.retryTextResource.mockResolvedValue(rowNamed('scan.pdf'));

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Retry scan.pdf'}));

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(resources.retryTextResource).toHaveBeenCalledWith('scan.pdf');
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

    it('should show each text of the Refusal as one item of the alert, in order', async () => {
      resources.retryTextResource.mockRejectedValue(
        new Refusal([
          {
            code: 'resource_not_failed',
            params: {resourceId: 'scan.pdf', ingestState: 'ingesting'}
          },
          {code: 'resource_not_found', params: {resourceId: 'scan.pdf'}}
        ])
      );

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Retry scan.pdf'}));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert)
          .getAllByRole('listitem')
          .map(item => item.textContent)
      ).toEqual([
        'This Resource is Ingesting. Only a Failed Resource can be ingested again. Reload the page.',
        'The library no longer holds this Resource. Reload the page.'
      ]);
    });

    it('should show every text of the Refusal, also two that are the same', async () => {
      resources.retryTextResource.mockRejectedValue(
        new Refusal([
          {code: 'resource_not_found', params: {resourceId: 'scan.pdf'}},
          {code: 'resource_not_found', params: {resourceId: 'notes.md'}}
        ])
      );
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      renderWithGateways(<LibrarySection />, {resources});

      await userEvent.click(await screen.findByRole('button', {name: 'Retry scan.pdf'}));

      const alert = await screen.findByRole('alert');

      expect(within(alert).getAllByRole('listitem')).toHaveLength(2);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
  });

  describe('the poll', () => {
    const POLL_INTERVAL = 2000;

    let resources: MockProxy<ResourceGateway>;

    beforeEach(() => {
      vi.useFakeTimers();
      resources = mock<ResourceGateway>();
    });

    afterEach(() => {
      vi.useRealTimers();
      theTabIs('visible');
    });

    // The async wrapper of Testing Library waits on a timer that it advances only for the fake timers of Jest, so findBy and user-event hang here.

    const theTabIs = (visibilityState: DocumentVisibilityState): void => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: visibilityState
      });
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
    };

    const aListThatWaits = (): {
      list: Promise<ResourceRow[]>;
      give: (rows: ResourceRow[]) => void;
    } => {
      let give: (rows: ResourceRow[]) => void = () => undefined;
      const list = new Promise<ResourceRow[]>(resolve => {
        give = resolve;
      });

      return {list, give};
    };

    const ready = (name: string): ResourceRow => ({
      ...rowNamed(name),
      ingestState: 'ready'
    });

    it('should ask for the list every 2 s while a Resource is Ingesting, and stop when none is', async () => {
      resources.list
        .mockResolvedValueOnce([rowNamed('notes.md')])
        .mockResolvedValueOnce([rowNamed('notes.md')])
        .mockResolvedValue([ready('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL - 1);

      expect(resources.list).toHaveBeenCalledOnce();

      await letTimePass(1);

      expect(resources.list).toHaveBeenCalledTimes(2);

      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(3);
      expect(screen.getByText('Ready')).toBeDefined();
      expect(screen.queryByRole('status', {name: 'Ingesting'})).toBeNull();

      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledTimes(3);
    });

    it('should not ask for the list when no Resource is Ingesting', async () => {
      resources.list.mockResolvedValue([ready('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledOnce();
    });

    it('should not ask for the list when the only Resource that is not Ready is Failed', async () => {
      resources.list.mockResolvedValue([
        {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'},
        ready('notes.md')
      ]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledOnce();
    });

    it('should ask for the list while one Resource of several is Ingesting', async () => {
      resources.list.mockResolvedValue([ready('manual.pdf'), rowNamed('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should start again when a create makes a Resource Ingesting', async () => {
      resources.list.mockResolvedValue([]);
      resources.createTextResource.mockResolvedValue(rowNamed('notes.md'));

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);
      dropOnTheDropZone(aFile('notes.md'));
      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should start again when a Retry makes a Resource Ingesting', async () => {
      resources.list.mockResolvedValue([
        {...rowNamed('scan.pdf'), ingestState: 'failed', reason: 'ingest_error'}
      ]);
      resources.retryTextResource.mockResolvedValue(rowNamed('scan.pdf'));

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);
      fireEvent.click(screen.getByRole('button', {name: 'Retry scan.pdf'}));
      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should stop while the tab is hidden, and start again when it is visible', async () => {
      resources.list.mockResolvedValue([rowNamed('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(0);
      theTabIs('hidden');
      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledOnce();

      theTabIs('visible');
      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should not start again when the tab is visible and no Resource is Ingesting', async () => {
      const tick = aListThatWaits();
      resources.list
        .mockResolvedValueOnce([rowNamed('notes.md')])
        .mockReturnValueOnce(tick.list);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);
      theTabIs('hidden');
      tick.give([ready('notes.md')]);
      await letTimePass(0);
      theTabIs('visible');
      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledTimes(2);
    });

    it('should show nothing when a tick fails, keep the list, and ask again at the next tick', async () => {
      resources.list
        .mockResolvedValueOnce([rowNamed('notes.md')])
        .mockRejectedValueOnce(
          new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
        )
        .mockResolvedValue([rowNamed('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByText('notes.md')).toBeDefined();

      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(3);
    });

    it('should wait for the response of a tick before it schedules the next', async () => {
      const tick = aListThatWaits();
      resources.list
        .mockResolvedValueOnce([rowNamed('notes.md')])
        .mockReturnValueOnce(tick.list)
        .mockResolvedValue([rowNamed('notes.md')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL * 5);

      expect(resources.list).toHaveBeenCalledTimes(2);

      tick.give([rowNamed('notes.md')]);
      await letTimePass(POLL_INTERVAL - 1);

      expect(resources.list).toHaveBeenCalledTimes(2);

      await letTimePass(1);

      expect(resources.list).toHaveBeenCalledTimes(3);
    });

    it('should keep a Resource that the owner creates while a tick is in flight', async () => {
      const tick = aListThatWaits();
      resources.list
        .mockResolvedValueOnce([rowNamed('old.md')])
        .mockReturnValueOnce(tick.list);
      resources.createTextResource.mockResolvedValue(rowNamed('new.md'));

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);
      dropOnTheDropZone(aFile('new.md'));
      await letTimePass(0);
      tick.give([ready('old.md')]);
      await letTimePass(0);

      expect(screen.getByText('old.md')).toBeDefined();
      expect(screen.getByText('new.md')).toBeDefined();
    });

    it('should show once a Resource that a tick holds before its create ends', async () => {
      let endTheCreate: (row: ResourceRow) => void = () => undefined;
      resources.list
        .mockResolvedValueOnce([rowNamed('old.md')])
        .mockResolvedValue([rowNamed('new.md'), rowNamed('old.md')]);
      resources.createTextResource.mockReturnValue(
        new Promise(resolve => (endTheCreate = resolve))
      );

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(0);
      dropOnTheDropZone(aFile('new.md'));
      await letTimePass(POLL_INTERVAL);

      expect(screen.getByText('new.md')).toBeDefined();

      endTheCreate(rowNamed('new.md'));
      await letTimePass(0);

      expect(screen.getAllByText('new.md')).toHaveLength(1);
    });

    it('should keep a Resource that the owner retries while a tick is in flight Ingesting', async () => {
      const tick = aListThatWaits();
      const failed: ResourceRow = {
        ...rowNamed('scan.pdf'),
        ingestState: 'failed',
        reason: 'ingest_error'
      };
      resources.list
        .mockResolvedValueOnce([failed, rowNamed('notes.md')])
        .mockReturnValueOnce(tick.list)
        .mockResolvedValue([rowNamed('scan.pdf')]);
      resources.retryTextResource.mockResolvedValue(rowNamed('scan.pdf'));

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);
      fireEvent.click(screen.getByRole('button', {name: 'Retry scan.pdf'}));
      await letTimePass(0);
      tick.give([failed]);
      await letTimePass(0);

      expect(screen.queryByRole('button', {name: 'Retry scan.pdf'})).toBeNull();

      await letTimePass(POLL_INTERVAL);

      expect(resources.list).toHaveBeenCalledTimes(3);
    });

    it('should take out a Resource that the list no longer holds, when the owner did not create it during the tick', async () => {
      resources.list
        .mockResolvedValueOnce([rowNamed('notes.md'), rowNamed('manual.pdf')])
        .mockResolvedValue([rowNamed('manual.pdf')]);

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(POLL_INTERVAL);

      expect(screen.queryByText('notes.md')).toBeNull();
      expect(screen.getByText('manual.pdf')).toBeDefined();
    });

    it('should remove the refusal of the list when a tick succeeds', async () => {
      resources.list
        .mockRejectedValueOnce(
          new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
        )
        .mockResolvedValue([rowNamed('notes.md'), rowNamed('old.md')]);
      resources.createTextResource.mockResolvedValue(rowNamed('notes.md'));

      renderWithGateways(<LibrarySection />, {resources});

      await letTimePass(0);

      expect(screen.getByRole('alert')).toBeDefined();

      dropOnTheDropZone(aFile('notes.md'));
      await letTimePass(POLL_INTERVAL);

      expect(screen.getByText('old.md')).toBeDefined();
      expect(screen.queryByRole('alert')).toBeNull();
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

      expect(
        screen.getByText(
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

        renderWithGateways(<LibrarySection />, {resources});

        await userEvent.upload(theDropZone(), aFile(name));

        expect(await screen.findByText(name)).toBeDefined();
        expect(resources.createImageResource).toHaveBeenCalledTimes(1);
        expect(resources.createTextResource).not.toHaveBeenCalled();
      }
    );

    it.each(['notes.md', 'manual.pdf', 'NOTES.TXT'])(
      'should send the text %j to the route of the texts',
      async name => {
        renderWithGateways(<LibrarySection />, {resources});

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
        renderWithGateways(<LibrarySection />, {resources});

        dropOnTheDropZone(aFile(name));

        expect(await screen.findByRole('alert')).toBeDefined();
        expect(resources.createImageResource).not.toHaveBeenCalled();
        expect(resources.createTextResource).not.toHaveBeenCalled();
      }
    );

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

    it('should show the drop zone differently while a drag is over it', () => {
      renderWithGateways(<LibrarySection />, {resources});

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

const deleteAndConfirm = async (name: string): Promise<void> => {
  await userEvent.click(await screen.findByRole('button', {name: `Delete ${name}`}));
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {name: 'Delete'})
  );
};

// jsdom applies no CSS, so it gives the animation that the classes of shadcn start on close.
const theDialogFadesOut = (): ReturnType<typeof vi.spyOn> => {
  const computedStyle = window.getComputedStyle;

  return vi
    .spyOn(window, 'getComputedStyle')
    .mockImplementation((element, pseudoElement) =>
      element.getAttribute('data-slot') === 'alert-dialog-content'
        ? ({
            display: 'grid',
            get animationName(): string {
              return element.getAttribute('data-state') === 'closed'
                ? 'fade-out'
                : 'fade-in';
            }
          } as CSSStyleDeclaration)
        : computedStyle(element, pseudoElement)
    );
};

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
