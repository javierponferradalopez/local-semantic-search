# CORS errors in local development

The frontend runs on `http://localhost:5173` and the API on
`http://localhost:3000`. For the browser, these are two different origins, so a
`fetch` from the frontend to the API fails with:

```
Access to fetch at 'http://localhost:3000/orders' from origin
'http://localhost:5173' has been blocked by CORS policy
```

## The fix: a proxy in Vite

We do not open CORS on the API. The dev server of Vite forwards the calls, so
that the browser sees only one origin:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
});
```

The frontend then calls `/api/orders`, not `http://localhost:3000/orders`.

## Why not open CORS on the API

In production, the frontend and the API are on the same domain, behind the same
proxy, so there is no CORS at all. An `Access-Control-Allow-Origin: *` added for
local development often ends up in production by mistake.
