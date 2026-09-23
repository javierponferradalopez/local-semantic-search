import type {RetryTextResourceRequest} from 'contract/RetryTextResourceRequest';
import type {RetryTextResourceResponse} from 'contract/RetryTextResourceResponse';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {RetryTextResource} from '../../../core/resources/use-cases/RetryTextResource';

type ConstructorParams = {retryTextResource: RetryTextResource};

const OK = 200;

const PARAMS: z.ZodType<RetryTextResourceRequest> = z.object({id: z.uuid()});

export class RetryTextResourceController {
  private readonly retryTextResource: RetryTextResource;

  public constructor({retryTextResource}: ConstructorParams) {
    this.retryTextResource = retryTextResource;
  }

  public async run(
    request: Request<RetryTextResourceRequest>,
    response: Response<RetryTextResourceResponse>
  ): Promise<void> {
    const {id} = PARAMS.parse(request.params);

    const row = await this.retryTextResource.run({id});

    response.status(OK).json(row);
  }
}
