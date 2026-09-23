import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {Request, Response} from 'express';
import type {GetResources} from '../../../core/resources/use-cases/GetResources';

type ConstructorParams = {getResources: GetResources};

export class GetResourcesController {
  private readonly getResources: GetResources;

  public constructor({getResources}: ConstructorParams) {
    this.getResources = getResources;
  }

  public async run(
    _request: Request,
    response: Response<GetResourcesResponse>
  ): Promise<void> {
    response.json(await this.getResources.run());
  }
}
