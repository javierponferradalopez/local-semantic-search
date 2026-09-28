import type {GetMatchesRequest} from 'contract/GetMatchesRequest';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {GetMatches} from '../../../core/search/use-cases/GetMatches';

type ConstructorParams = {getMatches: GetMatches};

// A check and not a trim: the Query reaches the embedder as the user typed it.
const INPUT: z.ZodType<GetMatchesRequest> = z.object({
  id: z.uuid(),
  q: z.string().regex(/\S/)
});

export class GetMatchesController {
  private readonly getMatches: GetMatches;

  public constructor({getMatches}: ConstructorParams) {
    this.getMatches = getMatches;
  }

  public async run(
    request: Request<Pick<GetMatchesRequest, 'id'>>,
    response: Response<GetMatchesResponse>
  ): Promise<void> {
    const {id, q} = INPUT.parse({id: request.params.id, q: request.query.q});

    response.json(await this.getMatches.run({id, query: q}));
  }
}
