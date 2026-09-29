import {render} from '@testing-library/react';
import type {JSX} from 'react';
import {useResources} from '@/resources/ResourcesContext';

const AReader = (): JSX.Element => {
  useResources();

  return <p />;
};

describe('useResources', () => {
  it('should say that the ResourcesProvider is missing when it is not above', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<AReader />)).toThrow(
      'The Resources are missing. The ResourcesProvider is not above.'
    );
  });
});
