import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {MatchRow} from 'contract/MatchRow';
import {ResourceNotFoundError} from '../../resources/domain/errors/ResourceNotFoundError';
import type {ResourceRepository} from '../../resources/domain/ResourceRepository';
import {TextResource} from '../../resources/domain/TextResource';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {TextEmbedder} from '../../shared/domain/services/TextEmbedder';
import type {Match} from '../domain/Match';
import type {ResultReader} from '../domain/ResultReader';
import type {Reranker} from '../domain/services/Reranker';
import {Floor} from '../domain/value-objects/Floor';
import {Query} from '../domain/value-objects/Query';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  textEmbedder: TextEmbedder;
  resultReader: ResultReader;
  reranker: Reranker;
  textFloor: number;
  matchesLimit: number;
};

type RunParams = {id: string; query: string};

export class GetMatches {
  private readonly resourceRepository: ResourceRepository;
  private readonly textEmbedder: TextEmbedder;
  private readonly resultReader: ResultReader;
  private readonly reranker: Reranker;
  private readonly textFloor: Floor;
  private readonly matchesLimit: number;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.textEmbedder = params.textEmbedder;
    this.resultReader = params.resultReader;
    this.reranker = params.reranker;
    this.textFloor = Floor.of({value: params.textFloor});
    this.matchesLimit = params.matchesLimit;
  }

  public async run({id, query}: RunParams): Promise<GetMatchesResponse> {
    const resourceId = ResourceId.of({value: id});
    const {value} = Query.of({value: query});

    const resource = await this.resourceRepository.find(resourceId);

    if (!(resource instanceof TextResource)) {
      throw ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(resourceId);
    }

    const vector = await this.textEmbedder.embedQuery(value);
    const firstStage = await this.resultReader.getMatchesBestFirst(resourceId, vector);
    const matches =
      firstStage.length === 0 ? [] : await this.reranker.rerankMatches(value, firstStage);

    return this.textFloor
      .keepTheMatchesThatReachIt(matches)
      .slice(0, this.matchesLimit)
      .map(match => this.matchRowOf(match));
  }

  private matchRowOf({text, page}: Match): MatchRow {
    return page === undefined ? {text} : {text, page};
  }
}
