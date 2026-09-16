# An SVG is served without a sandbox, and the script risk is accepted

SVG is a Content type of a Resource, because most diagrams are born vector and
the query that motivates the image feature points at a diagram. An SVG is also
a document that can carry a `<script>` element. **The application serves the
stored File with no sandbox and no sanitising, and the risk is accepted.**

Decided in
[The limits the gate enforces](https://github.com/javierponferradalopez/local-semantic-search/issues/17).

## The risk, exactly

A browser treats the same SVG in two ways:

- **Inside an `<img>`** — the results screen paints Pictures this way. The SVG
  is inert. Nothing inside it runs.
- **As a navigation to its URL** — this is what **Open** does.
  [What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
  made the name a link, and made the browser render the stored File with no
  viewer. Here the SVG is a document, and its script runs **with the origin of
  the application**. From there it can call the application's own API.

So a hostile SVG that the user downloads and adds can delete every Resource
while it paints a diagram.

## Why it is accepted

The application runs on the owner's machine, and the content is the owner's own
files. There is no other user, no other origin, and nothing to gain. The cost of
the attack is higher than what it reaches.

## Considered options

- **A `Content-Security-Policy: sandbox` header on SVG responses.** The
  complete answer, and it costs one header. The browser still paints the SVG
  and Open still works. Rejected only because the risk is accepted, not because
  the fix is expensive. **This is what to add first if the situation changes.**
- **Sanitising the SVG before the Ingest.** Rejected on the glossary. `CONTEXT.md`
  defines a `File` as the bytes that the user selected, and a `Checksum` as the
  fingerprint of those bytes. Sanitising makes the stored copy something else,
  and leaves the Checksum describing bytes that are not there.
- **Detecting a script and Failing the Resource.** Rejected because the
  detection cannot be complete — `<script>` is one vector among `on*` attributes,
  `javascript:` in an `href`, `<foreignObject>` and `@import` — and an
  incomplete check says "safe" when it is not. It also rejects a legitimate
  diagram that an export tool animated with script.

## Consequences

- **The day this stops being local, this ADR is the thing to read.** Any shared
  deployment, any second user, any hosted origin makes the risk real, and the
  sandbox header is the fix.
- **The rule of the Gate is untouched.** A script is found by opening the File,
  so it was never something the Gate could judge.
- **The stored File stays the user's bytes**, which is what keeps the glossary
  and the Checksum honest.
