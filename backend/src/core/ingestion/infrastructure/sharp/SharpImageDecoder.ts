import type {ImageContentType} from 'contract/ContentType';
import sharp, {type Sharp} from 'sharp';
import type {DecodedImage, ImageDecoder} from '../../domain/ImageDecoder';

// The resize fixes the memory of the decode, whatever the size of the File.
const LONG_EDGE_OF_THE_PIXELS = 1024;
const LONG_EDGE_OF_THE_THUMBNAIL = 320;

// An SVG with only a viewBox rasterises at 72 dpi, at the size of its viewBox.
const DEFAULT_SVG_DENSITY = 72;
// sharp refuses a density under 1, which a viewBox past 73728 units on its long edge asks for.
const LEAST_SVG_DENSITY = 1;

const WHITE = '#ffffff';
const CHANNELS = 3;

// It does not call RawImage.read, which decodes the full bitmap before any resize (#17 §6).
export class SharpImageDecoder implements ImageDecoder {
  public async decode(
    bytes: Buffer,
    contentType: ImageContentType
  ): Promise<DecodedImage> {
    const image = await this.imageOf(bytes, contentType);
    const {data, info} = await image
      .autoOrient()
      .resize(LONG_EDGE_OF_THE_PIXELS, LONG_EDGE_OF_THE_PIXELS, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .flatten({background: WHITE})
      .toColourspace('srgb')
      .raw()
      .toBuffer({resolveWithObject: true});

    // From the decoded pixels, so the File is decoded once; enlarged too, so every thumbnail has one size.
    const thumbnail = await sharp(data, {
      raw: {width: info.width, height: info.height, channels: CHANNELS}
    })
      .resize(LONG_EDGE_OF_THE_THUMBNAIL, LONG_EDGE_OF_THE_THUMBNAIL, {fit: 'inside'})
      .webp()
      .toBuffer();

    return {
      pixels: {
        data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
        width: info.width,
        height: info.height,
        channels: CHANNELS
      },
      thumbnail
    };
  }

  private async imageOf(bytes: Buffer, contentType: ImageContentType): Promise<Sharp> {
    if (contentType !== 'svg') {
      return sharp(bytes);
    }

    // The metadata does not rasterise, so the size of the viewBox at 72 dpi does not count.
    const {width, height} = await sharp(bytes, {limitInputPixels: false}).metadata();
    const density = Math.max(
      (DEFAULT_SVG_DENSITY * LONG_EDGE_OF_THE_PIXELS) / Math.max(width, height),
      LEAST_SVG_DENSITY
    );

    return sharp(bytes, {density});
  }
}
