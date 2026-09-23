import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ResourceRow} from 'contract/ResourceRow';
import {Refusal} from '@/gateways/Refusal';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import {LibrarySection} from '@/sections/LibrarySection';
import {mock} from '../../utils/mock';
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

    await userEvent.upload(
      screen.getByLabelText('Drop a file here, or pick one.'),
      new File(['a text'], 'notes.md', {type: 'text/markdown'})
    );

    expect(
      await screen.findByText(
        'These bytes are already in the library as "notes.md", which is Ready.'
      )
    ).toBeDefined();
  });
});
