import type {ImageResult} from 'contract/ImageResult';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {ImageEmbedder} from '../../shared/domain/services/ImageEmbedder';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {PictureResult} from '../domain/PictureResult';
import type {PictureResultReader} from '../domain/PictureResultReader';
import type {Result} from '../domain/Result';
import type {ResultReader} from '../domain/ResultReader';
import type {Reranker} from '../domain/services/Reranker';
import {Floor} from '../domain/value-objects/Floor';
import {Margin} from '../domain/value-objects/Margin';
import {Query} from '../domain/value-objects/Query';

type ConstructorParams = {
  textEmbedder: TextEmbedder;
  imageEmbedder: ImageEmbedder;
  resultReader: ResultReader;
  reranker: Reranker;
  pictureResultReader: PictureResultReader;
  fileStore: FileStore;
  textFloor: number;
  textMargin: number;
  imageFloor: number;
  imageMargin: number;
};

// A failed group is empty, so it does not stop the other group. The detail is for the developer.
const nothingForAFailedGroup = (group: 'text' | 'image', error: unknown): [] => {
  console.error(`The ${group} group of a Search failed`, error);

  return [];
};

// Two groups from two spaces: nothing merges, interleaves or ranks them together.
export class Search {
  private readonly textEmbedder: TextEmbedder;
  private readonly imageEmbedder: ImageEmbedder;
  private readonly resultReader: ResultReader;
  private readonly reranker: Reranker;
  private readonly pictureResultReader: PictureResultReader;
  private readonly fileStore: FileStore;
  private readonly textFloor: Floor;
  private readonly textMargin: Margin;
  private readonly imageFloor: Floor;
  private readonly imageMargin: Margin;

  public constructor(params: ConstructorParams) {
    this.textEmbedder = params.textEmbedder;
    this.imageEmbedder = params.imageEmbedder;
    this.resultReader = params.resultReader;
    this.reranker = params.reranker;
    this.pictureResultReader = params.pictureResultReader;
    this.fileStore = params.fileStore;
    this.textFloor = Floor.of({value: params.textFloor});
    this.textMargin = Margin.of({value: params.textMargin});
    this.imageFloor = Floor.of({value: params.imageFloor});
    this.imageMargin = Margin.of({value: params.imageMargin});
  }

  public async run({query}: {query: string}): Promise<SearchResponse> {
    const {value} = Query.of({value: query});
    const [text, images] = await Promise.all([
      this.textResultsOf(value),
      this.imageResultsOf(value)
    ]);

    return {text, images};
  }

  private async textResultsOf(query: string): Promise<TextResult[]> {
    try {
      const vector = await this.textEmbedder.embedQuery(query);
      const firstStage = await this.resultReader.getBestFirst(vector);
      const results =
        firstStage.length === 0 ? [] : await this.reranker.rerank(query, firstStage);

      return this.textFloor.isReachedBy(results)
        ? this.textMargin.cut(results).map(result => this.textResultOf(result))
        : [];
    } catch (error) {
      return nothingForAFailedGroup('text', error);
    }
  }

  private async imageResultsOf(query: string): Promise<ImageResult[]> {
    try {
      const vector = await this.imageEmbedder.embedQuery(query);
      const results = await this.pictureResultReader.getBestFirst(vector);

      return this.imageFloor.isReachedBy(results)
        ? this.imageMargin.cut(results).map(result => this.imageResultOf(result))
        : [];
    } catch (error) {
      return nothingForAFailedGroup('image', error);
    }
  }

  private textResultOf({
    resourceId,
    name,
    contentType,
    fileKey,
    bestMatch
  }: Result): TextResult {
    const textResult: TextResult = {
      resourceId,
      name,
      contentType,
      text: bestMatch.text,
      fileUrl: this.urlOf(fileKey)
    };

    return bestMatch.page === undefined
      ? textResult
      : {...textResult, page: bestMatch.page};
  }

  private imageResultOf({
    resourceId,
    name,
    fileKey,
    thumbnailKey
  }: PictureResult): ImageResult {
    return {
      resourceId,
      name,
      fileUrl: this.urlOf(fileKey),
      thumbnailUrl: this.urlOf(thumbnailKey)
    };
  }

  private urlOf(key: string): string {
    return this.fileStore.urlOf(FileKey.fromPrimitive({value: key}));
  }
}
