import type {PictureResult} from '../../src/core/search/domain/PictureResult';
import type {PictureResultReader} from '../../src/core/search/domain/PictureResultReader';
import type {Vector} from '../../src/core/shared/domain/value-objects/Vector';

type ConstructorParams = {pictureResultReader: PictureResultReader};

// The eval reads the image Results here, so the production code does not change for it.
export class RecordingPictureResultReader implements PictureResultReader {
  private readonly pictureResultReader: PictureResultReader;
  private lastResults: readonly PictureResult[] | undefined;

  public constructor({pictureResultReader}: ConstructorParams) {
    this.pictureResultReader = pictureResultReader;
  }

  public async getBestFirst(vector: Vector): Promise<PictureResult[]> {
    const results = await this.pictureResultReader.getBestFirst(vector);

    this.lastResults = results;

    return results;
  }

  // Undefined when the last Search did not read the image Results.
  public takeTheLastResults(): readonly PictureResult[] | undefined {
    const results = this.lastResults;

    this.lastResults = undefined;

    return results;
  }
}
