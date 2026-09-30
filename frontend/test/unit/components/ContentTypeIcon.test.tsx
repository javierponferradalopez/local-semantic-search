import {render, screen} from '@testing-library/react';
import type {ContentType} from 'contract/ContentType';
import {ContentTypeIcon} from '@/components/ContentTypeIcon';

const LABEL_OF: Record<ContentType, string> = {
  pdf: 'PDF',
  plain_text: 'Plain text',
  markdown: 'Markdown',
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  gif: 'GIF',
  avif: 'AVIF',
  svg: 'SVG'
};

describe('ContentTypeIcon', () => {
  it.each(Object.entries(LABEL_OF))(
    'should show a drawn icon, and no character, for %s',
    (contentType, label) => {
      render(<ContentTypeIcon contentType={contentType as ContentType} />);

      const icon = screen.getByRole('img', {name: label});

      expect(icon.getAttribute('title')).toBe(label);
      expect(icon.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(icon.textContent).toBe('');
    }
  );

  it('should show a different icon for each text Content type', () => {
    const drawingOf = (contentType: ContentType): string | undefined => {
      const {container, unmount} = render(<ContentTypeIcon contentType={contentType} />);
      const drawing = container.querySelector('svg')?.innerHTML;
      unmount();

      return drawing;
    };

    const drawings = new Set(
      ['pdf', 'plain_text', 'markdown'].map(t => drawingOf(t as ContentType))
    );

    expect(drawings.size).toBe(3);
  });

  it('should let the caller make the icon larger', () => {
    render(<ContentTypeIcon contentType="pdf" className="size-16" />);

    const drawing = screen.getByRole('img', {name: 'PDF'}).querySelector('svg');

    expect(drawing?.getAttribute('class')).toContain('size-16');
    expect(drawing?.getAttribute('class')).not.toContain('size-4');
  });
});
