import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {Request, Response} from 'express';
import type {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';

type ConstructorParams = {createTextResource: CreateTextResource};

const CREATED = 201;

export class CreateTextResourceController {
  private readonly createTextResource: CreateTextResource;

  public constructor({createTextResource}: ConstructorParams) {
    this.createTextResource = createTextResource;
  }

  public async run(
    request: Request,
    response: Response<CreateTextResourceResponse>
  ): Promise<void> {
    const file = request.file;

    if (file === undefined) {
      throw new Error('The request carries no file');
    }

    const row = await this.createTextResource.run({
      name: file.originalname,
      bytes: file.buffer
    });

    response.status(CREATED).json(row);
  }
}
