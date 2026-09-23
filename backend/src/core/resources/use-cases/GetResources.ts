import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {ResourceReader} from '../domain/ResourceReader';
import {resourceRowOf} from './resourceRowOf';

type ConstructorParams = {resourceReader: ResourceReader; fileStore: FileStore};

export class GetResources {
  private readonly resourceReader: ResourceReader;
  private readonly fileStore: FileStore;

  public constructor(params: ConstructorParams) {
    this.resourceReader = params.resourceReader;
    this.fileStore = params.fileStore;
  }

  public async run(): Promise<GetResourcesResponse> {
    const resources = await this.resourceReader.getNewestFirst();

    return resources.map(resource =>
      resourceRowOf({resource, fileStore: this.fileStore})
    );
  }
}
