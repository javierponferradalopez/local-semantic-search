import {act} from '@testing-library/react';

// React runs the effects of an async act when it ends, so the first act schedules the timers before the time passes.
export const letTimePass = async (milliseconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(0));
  await act(() => vi.advanceTimersByTimeAsync(milliseconds));
};
