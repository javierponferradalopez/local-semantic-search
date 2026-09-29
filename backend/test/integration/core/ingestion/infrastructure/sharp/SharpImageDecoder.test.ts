import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
import {SharpImageDecoder} from '../../../../../../src/core/ingestion/infrastructure/sharp/SharpImageDecoder';

const FIXTURES = join(import.meta.dirname, '../../../../../fixtures');

const aFixture = (name: string): Promise<Buffer> => readFile(join(FIXTURES, name));

const aPngOf = (width: number, height: number): Promise<Buffer> =>
  sharp({create: {width, height, channels: 3, background: '#3a7bd5'}})
    .png()
    .toBuffer();

describe('SharpImageDecoder', () => {
  const decoder = new SharpImageDecoder();

  describe('#decode', () => {
    it('should rasterise an SVG with only a viewBox at a usable size, not at 72 dpi', async () => {
      const {pixels} = await decoder.decode(
        await aFixture('a-diagram-with-only-a-viewbox.svg'),
        'svg'
      );

      expect(pixels.width).toBe(1024);
      expect(pixels.height).toBe(341);
    });

    it('should rasterise an SVG with a very large viewBox at a usable size', async () => {
      const {pixels} = await decoder.decode(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200000 100000"><rect width="10" height="10"/></svg>'
        ),
        'svg'
      );

      expect(pixels).toMatchObject({width: 1024, height: 512});
    });

    it('should paint the transparent background of an SVG white', async () => {
      const {pixels} = await decoder.decode(
        await aFixture('a-diagram-with-only-a-viewbox.svg'),
        'svg'
      );

      expect([...pixels.data.subarray(0, 3)]).toStrictEqual([255, 255, 255]);
    });

    it('should shrink a large image to 1024 px on its long edge before it gives the pixels', async () => {
      const {pixels} = await decoder.decode(await aPngOf(3000, 2000), 'png');

      expect(pixels).toMatchObject({width: 1024, height: 683, channels: 3});
      expect(pixels.data).toHaveLength(1024 * 683 * 3);
    });

    it('should give three channels for a greyscale image with transparency', async () => {
      const greyscale = await sharp({
        create: {
          width: 50,
          height: 40,
          channels: 4,
          background: {r: 0, g: 0, b: 0, alpha: 0.5}
        }
      })
        .toColourspace('b-w')
        .png()
        .toBuffer();

      const {pixels} = await decoder.decode(greyscale, 'png');

      expect(pixels.channels).toBe(3);
      expect(pixels.data).toHaveLength(50 * 40 * 3);
    });

    it('should turn the pixels upright by the orientation of the File', async () => {
      const turned = await sharp({
        create: {width: 300, height: 100, channels: 3, background: '#3a7bd5'}
      })
        .jpeg()
        .withMetadata({orientation: 6})
        .toBuffer();

      const {pixels} = await decoder.decode(turned, 'jpeg');

      expect(pixels).toMatchObject({width: 100, height: 300});
    });

    it('should keep the size of a small image', async () => {
      const {pixels} = await decoder.decode(await aFixture('a-small-picture.png'), 'png');

      expect(pixels).toMatchObject({width: 96, height: 64, channels: 3});
    });

    it.each([
      ['a large PNG', (): Promise<Buffer> => aPngOf(3000, 2000), 'png', 320, 213],
      ['a tall PNG', (): Promise<Buffer> => aPngOf(500, 1000), 'png', 160, 320],
      [
        'an SVG with only a viewBox',
        (): Promise<Buffer> => aFixture('a-diagram-with-only-a-viewbox.svg'),
        'svg',
        320,
        107
      ],
      [
        'a small PNG',
        (): Promise<Buffer> => aFixture('a-small-picture.png'),
        'png',
        320,
        213
      ]
    ] as const)(
      'should give a WebP thumbnail of 320 px on its long edge for %s',
      async (_, bytesOf, contentType, width, height) => {
        const {thumbnail} = await decoder.decode(await bytesOf(), contentType);

        expect(await sharp(thumbnail).metadata()).toMatchObject({
          format: 'webp',
          width,
          height
        });
      }
    );
  });
});
