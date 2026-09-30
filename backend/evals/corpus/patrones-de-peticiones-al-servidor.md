# Patrones de peticiones al servidor

Cómo pide datos el frontend al servidor: el cliente HTTP, la caché con
TanStack Query, los errores y la paginación. Todo el código vive en
`src/data/`, y ningún componente llama a `fetch` directamente.

## El cliente HTTP

Todas las peticiones pasan por `httpClient`. Añade la cabecera de la sesión,
fija un tiempo máximo de diez segundos y convierte una respuesta que no es 2xx
en un `HttpError` con el código de estado.

```ts
export const httpClient = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`},
    signal: init.signal ?? AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new HttpError(response.status, await response.text());
  }

  return response.json() as Promise<T>;
};
```

- No pongas la URL base en un componente: sale de `API_URL`.
- Un `204 No Content` no tiene cuerpo, así que la función que lo espera usa
  `httpClient<void>` y no lee `response.json()`.

## Leer datos con useQuery

Cada recurso tiene su hook en `src/data/queries/`. La clave de la caché empieza
siempre por el nombre del recurso y sigue con sus parámetros.

```ts
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const
};

export const useProject = (id: string) =>
  useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: ({signal}) => httpClient<Project>(`/projects/${id}`, {signal}),
    staleTime: 30_000
  });
```

Con `staleTime` de 30 segundos, volver a una pantalla no repite la petición si
los datos son recientes. El `signal` que da TanStack Query cancela la petición
cuando el componente se desmonta antes de que llegue la respuesta.

## Guardar datos con useMutation

Una mutación invalida las claves que cambia. No actualices la caché a mano
salvo en la actualización optimista.

```ts
export const useRenameProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, name}: {id: string; name: string}) =>
      httpClient<void>(`/projects/${id}`, {method: 'PATCH', body: JSON.stringify({name})}),
    onSuccess: (_, {id}) => {
      queryClient.invalidateQueries({queryKey: projectKeys.detail(id)});
      queryClient.invalidateQueries({queryKey: projectKeys.all});
    }
  });
};
```

### Actualización optimista

Cuando el usuario marca una tarea como hecha, la lista cambia antes de que
responda el servidor. Si la petición falla, `onError` devuelve la copia que
guardó `onMutate`.

```ts
onMutate: async ({id}) => {
  await queryClient.cancelQueries({queryKey: taskKeys.all});
  const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
  queryClient.setQueryData<Task[]>(taskKeys.all, tasks =>
    tasks?.map(task => (task.id === id ? {...task, done: true} : task))
  );

  return {previous};
},
onError: (_, __, context) => queryClient.setQueryData(taskKeys.all, context?.previous)
```

## Reintentos y errores

TanStack Query reintenta tres veces una petición que falla. Un error 4xx no
cambia al repetirlo, así que solo se reintentan los errores de red y los 5xx.

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 3 && !(error instanceof HttpError && error.status < 500),
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000)
    }
  }
});
```

| Código | Qué hace el frontend |
|---|---|
| 401 | borra la sesión y lleva a la pantalla de entrada |
| 403 | muestra "no tienes permiso" en el lugar del contenido |
| 404 | muestra la página de "no encontrado" |
| 409 | vuelve a leer el recurso y avisa de que otra persona lo cambió |
| 5xx | reintenta y, después, muestra un aviso con el botón "Reintentar" |

El 401 se trata una sola vez, en `queryCache.onError`, y no en cada hook.

## Paginación infinita

Las listas largas piden páginas de 50 elementos con un cursor. El servidor
devuelve `nextCursor: null` en la última página.

```ts
export const useActivity = () =>
  useInfiniteQuery({
    queryKey: ['activity'],
    queryFn: ({pageParam, signal}) =>
      httpClient<Page<Event>>(`/activity?cursor=${pageParam ?? ''}&limit=50`, {signal}),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor
  });
```

La lista llama a `fetchNextPage()` cuando el último elemento entra en la
pantalla, con un `IntersectionObserver`. No pidas la página siguiente si
`isFetchingNextPage` es `true`.

## Subir un archivo

Una subida no pasa por `httpClient`, porque el cuerpo es un `FormData` y el
navegador pone su propio `Content-Type` con el separador de las partes.

```ts
const body = new FormData();
body.append('file', file);
await fetch(`${API_URL}/uploads`, {method: 'POST', body, headers: {Authorization: `Bearer ${session.token}`}});
```

Para mostrar el progreso de la subida hace falta `XMLHttpRequest` y su evento
`upload.onprogress`: `fetch` no da el progreso del envío.

## Probar un hook

Los tests no llaman al servidor. MSW contesta las peticiones, y cada test crea
un `QueryClient` nuevo con `retry: false` para que un error no tarde en llegar.

```ts
server.use(http.get(`${API_URL}/projects/p1`, () => HttpResponse.json({id: 'p1', name: 'Web'})));

const {result} = renderHook(() => useProject('p1'), {wrapper: withQueryClient()});

await waitFor(() => expect(result.current.data?.name).toBe('Web'));
```
