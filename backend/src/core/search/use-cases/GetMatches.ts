import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {MatchRow} from 'contract/MatchRow';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import type {Match} from '../domain/Match';
import type {ResultReader} from '../domain/ResultReader';
import {Query} from '../domain/value-objects/Query';

type ConstructorParams = {
  textEmbedder: TextEmbedder;
  resultReader: ResultReader;
};

type RunParams = {id: string; query: string};

// No Floor: the owner arrives from a Result whose best Match already reached it.
export class GetMatches {
  private readonly textEmbedder: TextEmbedder;
  private readonly resultReader: ResultReader;

  public constructor(params: ConstructorParams) {
    this.textEmbedder = params.textEmbedder;
    this.resultReader = params.resultReader;
  }

  public async run({id, query}: RunParams): Promise<GetMatchesResponse> {
    const resourceId = ResourceId.of({value: id});
    const {value} = Query.of({value: query});
    const vector = await this.textEmbedder.embedQuery(value);
    const matches = await this.resultReader.getMatchesBestFirst(resourceId, vector);

    return matches.map(match => this.matchRowOf(match));
  }

  private matchRowOf({text, page}: Match): MatchRow {
    return page === undefined ? {text} : {text, page};
  }
}
