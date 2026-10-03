# Server-sent events para los avisos

Decisión del equipo: los avisos en tiempo real (un pedido nuevo, un pago
recibido) llegan al navegador por server-sent events (SSE).

## Por qué SSE y no WebSockets

- Los avisos van en un solo sentido, del servidor al navegador. Un WebSocket es de
  dos sentidos, y no lo necesitamos.
- SSE es HTTP normal: pasa por el proxy y por el balanceador de hoy sin cambiar
  nada. Los WebSockets nos obligaban a configurar el balanceador.
- El navegador ya trae `EventSource`, sin ninguna librería.

## Cómo es

El endpoint es `GET /events`. El servidor deja la respuesta abierta con
`Content-Type: text/event-stream` y escribe un mensaje por cada aviso:

```
event: order-created
data: {"orderId": "o_8812", "total": 42.5}
```

En el cliente:

```ts
const events = new EventSource('/events', {withCredentials: true});

events.addEventListener('order-created', event => {
  const {orderId} = JSON.parse(event.data);
  showNotice(`Pedido nuevo: ${orderId}`);
});
```

## El límite

Un navegador con HTTP/1.1 abre como mucho seis conexiones a un mismo dominio, y
cada pestaña con SSE gasta una. Con HTTP/2 no pasa, y nuestro servidor ya usa
HTTP/2.
