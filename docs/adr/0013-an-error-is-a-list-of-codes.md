# An error is a list of codes, not a problem document

**Every error body has one shape: `{ errors: [ { code, params } ] }`. It is
always a list, and it is always `application/json`.** RFC 9457 (Problem Details
for HTTP APIs) was examined and refused.

Decided in
[The contract between the browser and the API](https://github.com/javierponferradalopez/local-semantic-search/issues/20),
which
[The limits the gate enforces](https://github.com/javierponferradalopez/local-semantic-search/issues/17)
left open on purpose.

## Why RFC 9457 was refused

#17 called RFC 9457 a good fit, so the refusal needs a reason on the record.

**Its two human-readable members cannot be sent.** `title` and `detail` are
English written by the server. #17 decided that the English text of an error
belongs to the developer reading a log: *"Nobody sends it and nobody stores
it."* The frontend holds the text the user reads, keyed by the code.

**Without those members the standard is an empty shell.** What remains is a
`type` URI that points at nothing in a local application, a `status` that
repeats the header, and a list of validation failures that must go into an
extension member anyway.

**Its principle is kept, and only its envelope is dropped.** The principle #17
praised is that the consumer keys on a stable identifier, and that data travels
in structured members instead of being read out of a sentence. `code` is that
identifier. `params` is that data.

## The shape, and why it is always a list

Zod gives several failures for one request, and #17 requires **one shape for
every error, Zod included**, so the frontend has one render function and no
branch. A shape that is an object for one failure and a list for several **is**
that branch.

`ErrorItem` is a discriminated union in `contract/`: each code declares the
exact shape of its params. The render function of the frontend is therefore
exhaustive by compilation. A new code does not compile until it has its text.

## The status code, and the rule that makes it secondary

**The frontend keys on the code, and never on the status.** The status serves
the transport and the tools of the browser. The code is the contract.

| Situation | Status | Code |
|---|---|---|
| Several files in one upload | 400 | `multiple_files` |
| Zod: an invalid query or identifier | 400 | one item per failure, with its path |
| A content type that is not accepted | 400 | `unsupported_content_type` |
| A file above the limit | 413 | `file_too_large` |
| The same bytes are already stored | 409 | `duplicate_resource` |
| An identifier that is not known | 404 | `resource_not_found` |
| Stage 2 of the Ingest fails | 422 | the `Reason`, with `resourceId` in its params |

**415 is refused for an unsupported content type.** That status speaks about the
`Content-Type` of the request, and #17 decided to ignore the MIME type the
browser declares and to judge by the extension. 415 would give a reason the
system does not use.

## What this costs

**422 also covers the catch-all**, which is a true fault of the server. This is
a small untruth, and it is accepted because the row says `Failed` in both cases
and #17 requires the two outputs of one mapper to say the same thing. That case
must therefore stay in the log with the English message for the developer, which
does not travel.

**The API speaks a dialect of its own.** It has one consumer, in the same
repository, which shares its types. A second consumer would have to learn the
shape instead of recognising it.
