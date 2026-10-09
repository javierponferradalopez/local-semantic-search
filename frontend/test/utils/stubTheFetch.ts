import type {Mock} from 'vitest';

export const stubTheFetch = (
  status: number,
  body: unknown
): Mock<typeof globalThis.fetch> => {
  const falseFetch = vi.fn<typeof globalThis.fetch>(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: {'content-type': 'application/json'}
      })
    )
  );

  vi.stubGlobal('fetch', falseFetch);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });

  return falseFetch;
};
