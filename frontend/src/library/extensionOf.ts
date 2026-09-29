export const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');

  return dot > 0 ? name.slice(dot).toLowerCase() : '';
};
