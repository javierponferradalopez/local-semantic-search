import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {Search} from '../../../core/search/use-cases/Search';

type ConstructorParams = {search: Search};

// A check and not a trim: the Query reaches the embedder as the user typed it.
const QUERY: z.ZodType<SearchRequest> = z.object({q: z.string().regex(/\S/)});

export class SearchController {
  private readonly search: Search;

  public constructor({search}: ConstructorParams) {
    this.search = search;
  }

  public async run(request: Request, response: Response<SearchResponse>): Promise<void> {
    const {q} = QUERY.parse(request.query);

    response.json(await this.search.run({query: q}));
  }
}
