# Local semantic search

A local product that finds a user's own content by meaning. The user adds files,
the system stores their vectors, and the user finds the content when they type
text.

## Language

### Content

**Resource**:
One item of content that the user added, with its name, its type and its stored
copy. It is what the user sees in a list and deletes.
_Avoid_: File, Asset, Document, Item

**File**:
The bytes that the user selected on their disk, and the copy that a Resource
owns. A File is never a record. The record is the Resource.

**Chunk**:
A passage of text that comes from a Resource, with its Vector and its Locator.
A Chunk is always text.
_Avoid_: Fragment, Passage, Segment, Piece

**Picture**:
An image that comes from a Resource. The vision model embeds it whole. It has a
Vector and a Locator, and it has no text.
_Avoid_: Image (that word is a content type of a Resource), Visual, Depiction

**Locator**:
The place, inside its Resource, where a Chunk or a Picture was. Its shape
changes with the content type: a page and a box in a PDF, an offset in a text
file.
_Avoid_: Position, Coordinates, Offset, Anchor

**Vector**:
The list of numbers that a model calculates for a Chunk, a Picture or a Query.
_Avoid_: Embedding as a noun. Use "embed" only as a verb.

**Ingest**:
To read a File, to make its Chunks or its Picture, and to store them with their
Vectors.
_Avoid_: Index as a verb. The word "index" is only the index of the database.

**Checksum**:
The fingerprint of the bytes of a File. It is the identity of the content, as
against the name, which is only a label.
_Avoid_: Hash, Fingerprint, Digest

### Ingestion

**Ingest state**:
How far a Resource has got through its Ingest. It has three values, and it is
the only thing about the Ingest that the user sees.
_Avoid_: Status, Phase, Stage

**Ingesting**:
The Ingest state of a Resource whose File is stored and whose work is running.
_Avoid_: Pending, Processing, Running

**Ready**:
The Ingest state of a Resource whose Chunks or Picture are stored with their
Vectors.
_Avoid_: Done, Complete, Indexed, Searchable

**Failed**:
The Ingest state of a Resource whose Ingest broke. It keeps its Reason and its
File, so it can be ingested again.
_Avoid_: Error, Broken, Rejected

**Reason**:
The short text that a Failed Resource keeps. It is written for the user, and it
is not a developer trace.
_Avoid_: Error, Message, Trace, Cause

### Search

**Query**:
The text that the user typed.

**Search**:
The act that takes a Query and gives back Results. It is one operation, and it
looks for Chunks and for Pictures.

**Match**:
One Chunk or one Picture that a Query found, with its score and its Locator. It
exists only for that Query.
_Avoid_: Hit, Candidate, Neighbour

**Result**:
One Resource that a Query found, with the Matches that found it. Its rank comes
from its best Match.
_Avoid_: Row, Item, Answer

**Citation**:
The pointer that a Result shows. It is made from a Resource and a Locator. The
system composes it to show it, and does not store it.
_Avoid_: Reference, Source

### Models

**Text model**:
The model that embeds Chunks and the Query for the search of Chunks.

**Vision model**:
The model that embeds Pictures and the Query for the search of Pictures. Its
space is not the space of the Text model, and the two are never compared.
