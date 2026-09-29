import type {RetryImageResourceRequest} from 'contract/RetryImageResourceRequest';
import type {RetryImageResourceResponse} from 'contract/RetryImageResourceResponse';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {RetryImageResource} from '../../../core/resources/use-cases/RetryImageResource';

type ConstructorParams = {retryImageResource: RetryImageResource};

const OK = 200;

const PARAMS: z.ZodType<RetryImageResourceRequest> = z.object({id: z.uuid()});

export class RetryImageResourceController {
  private readonly retryImageResource: RetryImageResource;

  public constructor({retryImageResource}: ConstructorParams) {
    this.retryImageResource = retryImageResource;
  }

  public async run(
    request: Request<RetryImageResourceRequest>,
    response: Response<RetryImageResourceResponse>
  ): Promise<void> {
    const {id} = PARAMS.parse(request.params);

    const row = await this.retryImageResource.run({id});

    response.status(OK).json(row);
  }
}
