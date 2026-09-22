import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';

describe('the maximum size of a File', () => {
  it('should be the 50 MB that both halves read', () => {
    expect(MAXIMUM_FILE_SIZE_IN_BYTES).toBe(52_428_800);
  });
});
