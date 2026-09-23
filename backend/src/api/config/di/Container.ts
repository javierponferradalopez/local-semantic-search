// A shape, not a constructor type, so that a class with a private constructor is a Port too.
export type Port<T> = {readonly name: string; readonly prototype: T};

export type DependencyIdentifier<T> = string | Port<T>;

export class Container {
  private readonly dependencies = new Map<string, unknown>();

  public registerImplementation<T extends object>(
    identifier: DependencyIdentifier<T>,
    instance: T
  ): void {
    const name = nameOf(identifier);

    if (this.dependencies.has(name)) {
      throw new Error(`The dependency ${name} is already registered`);
    }

    this.dependencies.set(name, instance);
  }

  public getDependency<T>(identifier: DependencyIdentifier<T>): T {
    const name = nameOf(identifier);
    const dependency = this.dependencies.get(name);

    if (dependency === undefined) {
      throw new Error(`The dependency ${name} is not registered`);
    }

    return dependency as T;
  }
}

const nameOf = (identifier: DependencyIdentifier<unknown>): string =>
  typeof identifier === 'string' ? identifier : identifier.name;

export const container = new Container();
