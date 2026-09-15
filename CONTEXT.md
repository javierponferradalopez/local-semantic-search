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
