import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {Result} from '../domain/Result';
import type {ResultReader} from '../domain/ResultReader';
import {Floor} from '../domain/value-objects/Floor';
import {Query} from '../domain/value-objects/Query';

type ConstructorParams = {
  textEmbedder: TextEmbedder;
  resultReader: ResultReader;
  fileStore: FileStore;
  textFloor: number;
};

export class Search {
  private readonly textEmbedder: TextEmbedder;
  private readonly resultReader: ResultReader;
  private readonly fileStore: FileStore;
  private readonly textFloor: Floor;

  public constructor(params: ConstructorParams) {
    this.textEmbedder = params.textEmbedder;
    this.resultReader = params.resultReader;
    this.fileStore = params.fileStore;
    this.textFloor = Floor.of({value: params.textFloor});
  }

  public async run({query}: {query: string}): Promise<SearchResponse> {
    const {value} = Query.of({value: query});
    const vector = await this.textEmbedder.embedQuery(value);
    const results = await this.resultReader.getBestFirst(vector);
    const text = this.textFloor.isReachedBy(results)
      ? results.map(result => this.textResultOf(result))
      : [];

    return {text, images: []};
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
      fileUrl: this.fileStore.urlOf(FileKey.fromPrimitive({value: fileKey}))
    };

    return bestMatch.page === undefined
      ? textResult
      : {...textResult, page: bestMatch.page};
  }
}
