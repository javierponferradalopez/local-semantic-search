import type {CreateImageResourceResponse} from 'contract/CreateImageResourceResponse';
import type {Request, Response} from 'express';
import type {CreateImageResource} from '../../../core/resources/use-cases/CreateImageResource';

type ConstructorParams = {createImageResource: CreateImageResource};

const CREATED = 201;

export class CreateImageResourceController {
  private readonly createImageResource: CreateImageResource;

  public constructor({createImageResource}: ConstructorParams) {
    this.createImageResource = createImageResource;
  }

  public async run(
    request: Request,
    response: Response<CreateImageResourceResponse>
  ): Promise<void> {
    const file = request.file;

    if (file === undefined) {
      throw new Error('The request carries no file');
    }

    const row = await this.createImageResource.run({
      name: file.originalname,
      bytes: file.buffer
    });

    response.status(CREATED).json(row);
  }
}
