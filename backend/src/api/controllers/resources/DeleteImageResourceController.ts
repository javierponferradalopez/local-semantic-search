import type {DeleteImageResourceRequest} from 'contract/DeleteImageResourceRequest';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';

type ConstructorParams = {deleteResource: DeleteResource};

const NO_CONTENT = 204;

const PARAMS: z.ZodType<DeleteImageResourceRequest> = z.object({id: z.uuid()});

export class DeleteImageResourceController {
  private readonly deleteResource: DeleteResource;

  public constructor({deleteResource}: ConstructorParams) {
    this.deleteResource = deleteResource;
  }

  public async run(
    request: Request<DeleteImageResourceRequest>,
    response: Response
  ): Promise<void> {
    const {id} = PARAMS.parse(request.params);

    await this.deleteResource.run({id});

    response.status(NO_CONTENT).end();
  }
}
