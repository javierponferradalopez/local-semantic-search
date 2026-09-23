import type {DeleteTextResourceRequest} from 'contract/DeleteTextResourceRequest';
import type {Request, Response} from 'express';
import {z} from 'zod';
import type {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';

type ConstructorParams = {deleteResource: DeleteResource};

const NO_CONTENT = 204;

const PARAMS: z.ZodType<DeleteTextResourceRequest> = z.object({id: z.uuid()});

export class DeleteTextResourceController {
  private readonly deleteResource: DeleteResource;

  public constructor({deleteResource}: ConstructorParams) {
    this.deleteResource = deleteResource;
  }

  public async run(
    request: Request<DeleteTextResourceRequest>,
    response: Response
  ): Promise<void> {
    const {id} = PARAMS.parse(request.params);

    await this.deleteResource.run({id});

    response.status(NO_CONTENT).end();
  }
}
