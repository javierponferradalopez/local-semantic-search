# The API gives a URL, not the bytes

The interface must show a stored `File` and a thumbnail. The API does not stream
them from an endpoint of its own. **Every response that points at a binary
carries a URL, and the client uses that URL as it is.** The `FileStore` port
gains one operation: give the URL of this key.

Decided in
[The contract between the browser and the API](https://github.com/javierponferradalopez/local-semantic-search/issues/20).

## Why

[How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12)
frames the arrangement as a simulation of a real deployment, where
`backend/data/resources/` stands in for S3. A real deployment does not stream a
binary through the application. It gives a URL and the client gets the bytes
from the store.

The location is the business of the file store, not of the browser.
`FilesystemFileStore` gives `/files/<key>`. `S3FileStore` will give a signed
URL. The domain does not change, and the frontend does not change.

**An identifier is not sufficient.** A client can build a URL from an identifier
only while it knows the rule that builds it. That rule is exactly what changes
on the day the store moves.

## Why the opposite rule was set first, and was wrong

Earlier in the same session the ticket held that the wire carries no URL. That
rule guards against **composed presentation** — a sentence written by the
server, a clamped text, the `#page=N` fragment. A location is none of those.

The rule is now: **the wire carries nothing the client can compose, and it does
carry what the client cannot know.**

[ADR-0009](0009-a-chunk-knows-its-page-and-nothing-else.md) was cited against
the field and does not apply. ADR-0009 deleted a value that nothing read. A file
URL is read at every paint.

## What this costs

- **Two endpoints do not exist**: `/resources/:id/file` and
  `/resources/:id/thumbnail`. Static middleware serves the bytes from the folder
  the application owns.
- **That middleware must refuse path traversal.**
  [ADR-0001](0001-postgres-with-pgvector-as-the-single-store.md) requires the
  stored key to resolve inside its folder and nowhere else.
- **The URLs are outside the `Resource` endpoints.** Today the application is
  local and has no session, so nothing is lost. A remote store answers this with
  the signature in the URL.
- **The client must not parse the URL, and must not put a prefix in front of
  it.** Today it is relative. Tomorrow it is absolute. A client that builds on
  it breaks on that day.

## Consequences

- `ResourceRow` and `TextResult` carry `fileUrl`. `ImageResult` carries
  `fileUrl` and `thumbnailUrl`.
- **The difference between a text and an image is in the types, not in the
  routes.** A PDF has no thumbnail because its type has no such field, not
  because a route gives 404.
- The browser adds `#page=N`. A fragment is presentation, and it does not
  travel.
- **Amends
  [How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12)**:
  the `FileStore` port has an operation that gives a URL.
