import {render, screen} from '@testing-library/react';
import {ResourceCard} from '@/search/ResourceCard';

describe('ResourceCard', () => {
  it('should show the thumbnail inside an img, with the name under it', () => {
    render(
      <ResourceCard
        name="the beach.svg"
        fileUrl="/files/the beach.svg"
        thumbnailUrl="/files/the beach.webp"
      />
    );

    const link = screen.getByRole('link', {name: 'the beach.svg'});
    const thumbnail = link.querySelector('img');

    expect(thumbnail?.getAttribute('src')).toBe('/files/the beach.webp');
    expect(thumbnail?.getAttribute('alt')).toBe('');
    expect(thumbnail?.compareDocumentPosition(screen.getByText('the beach.svg'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('should show a large icon in place of the thumbnail when there is none', () => {
    render(
      <ResourceCard
        name="the manual.pdf"
        fileUrl="/files/the manual.pdf"
        contentType="pdf"
      />
    );

    const link = screen.getByRole('link', {name: 'the manual.pdf'});

    expect(link.querySelector('img')).toBeNull();
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('should give the link only the name, and not the label of the icon', () => {
    render(
      <ResourceCard
        name="the manual.pdf"
        fileUrl="/files/the manual.pdf"
        contentType="pdf"
      />
    );

    expect(screen.getByRole('link', {name: 'the manual.pdf'})).toBeDefined();
    expect(screen.queryByRole('img', {name: 'PDF'})).toBeNull();
  });

  it('should open the fileUrl as it is, in a new tab', () => {
    const fileUrl = 'https://store.example/resources/an%20id/manual.pdf?signature=a';

    render(<ResourceCard name="the manual.pdf" fileUrl={fileUrl} contentType="pdf" />);

    const link = screen.getByRole('link', {name: 'the manual.pdf'});

    expect(link.getAttribute('href')).toBe(fileUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should show the full name as a title, when the card cuts it', () => {
    render(
      <ResourceCard
        name="a very long name of a picture.png"
        fileUrl="/files/a.png"
        thumbnailUrl="/files/a.webp"
      />
    );

    expect(
      screen.getByText('a very long name of a picture.png').getAttribute('title')
    ).toBe('a very long name of a picture.png');
  });
});
