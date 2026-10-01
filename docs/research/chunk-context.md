# How a Chunk gets the context of its Resource without an LLM

Research for [#102](https://github.com/javierponferradalopez/local-semantic-search/issues/102), map [#94](https://github.com/javierponferradalopez/local-semantic-search/issues/94). Date: 2026-10-01. "Not verified" marks a claim that we did not measure or read in a primary source.

## The start point in this repo

- `CodePointCutter` finds headings only in Markdown. PDF and plain text use the paragraph ladder, so they have no heading path.
- In Markdown, the heading text goes into the first piece of its section only. The second and next pieces of a long section do not contain the heading.
- `TransformersTextEmbedder` adds `passage: ` and puts the text in windows of 512 tokens minus the special tokens and the prefix. A longer text gets two or more windows and the mean of their vectors.
- `TransformersReranker` has a wall of 512 tokens for the Query and the Chunk together, with "longest first" truncation.
- The Floor of −0.58 (ADR-0040) is calibrated on the text of the Chunk with no header.

## 1. Context from the structure only

### What the practice is

Put a short header before the text of the Chunk: the name of the Resource, the path of headings ("Doc > H1 > H2"), and sometimes the page or a summary. The header comes from the parser, not from an LLM.

- **LlamaIndex** puts the metadata in the text by default, for the embedding model and for the LLM (`{key}: {value}` lines, then a blank line, then the content). Each key can be excluded from one side or the other. Its cross-encoder reranker (`SentenceTransformerRerank`) scores `get_content(MetadataMode.EMBED)`, so the reranker sees the same header as the embedder. [docs](https://developers.llamaindex.ai/python/framework/module_guides/loading/documents_and_nodes/usage_documents/), [source](https://github.com/run-llama/llama_index/blob/main/llama-index-integrations/postprocessor/llama-index-postprocessor-sbert-rerank/llama_index/postprocessor/sbert_rerank/base.py)
- **Unstructured** `chunk_by_title` cuts at headings and keeps the original elements in metadata. Its "contextual chunking" prefix is made by an LLM. [docs](https://docs.unstructured.io/ui/chunking)
- **dsRAG** "contextual chunk headers" contain the title of the document and the title of the section. In dsRAG, an LLM writes the section titles and, if no title is given, the document title. The headers go before the Chunk for the embedding. [repo](https://github.com/D-Star-AI/dsRAG)

### Evidence of the gain

- **Title chain with no LLM** ([arXiv 2608.00824](https://arxiv.org/html/2608.00824)): a prefix `[doc > h1 > h2]` on each Chunk. MRR@5 goes from 0.374 to 0.463 (+23.8%) on 1600 Queries, and from 0.828 to 0.925 on the answerable ones. The top-1 changes for 86.9% of the Queries. Limits: one private Markdown corpus, one model (`text-embedding-v4`), and the paper does not isolate the prefix from its other stages. The reranker (an LLM) sees the prefixed text.
- **dsRAG on KITE**: the mean score goes from 4.72 (top-k) to 6.04 (headers + top-k). The gain is large on two datasets (2.6 to 6.3, 6.1 to 7.4) and small on two (4.5 to 4.7, 5.7 to 5.8). The section titles come from an LLM, so this is an upper limit for our case.
- **Anthropic, Contextual Retrieval** ([post](https://www.anthropic.com/news/contextual-retrieval)): a context of 50–100 tokens, written by an LLM, decreases the top-20 failure rate from 5.7% to 3.7% (embeddings only), 2.9% (with BM25) and 1.9% (with a reranker). The post also says that "generic document summaries" on the Chunks gave very limited gains. This is evidence against a summary from the first lines. The post does not say if the reranker sees the context (not verified).
- **Snowflake on finance filings** ([blog](https://www.snowflake.com/en/blog/engineering/impact-retrieval-chunking-finance-rag/)): Chunks of about 1800 characters with document metadata in front are better than large Chunks. Their metadata is made by an LLM.

We found no independent benchmark that isolates "file name + heading path, no LLM" on a public dataset (not verified that none exists). The evidence is consistent, but it is from vendors and single corpora.

### The page and the first lines

The page number has no meaning for the embedding model. Keep it as metadata for the display. A summary from the first lines puts the same text on all Chunks of a Resource; Anthropic reports very limited gains for this kind of summary.

### Token cost with a 512-token model

A header such as `Guía del pulpo > Anatomía > Patas` is about 10–25 tokens with the XLM-R tokenizer of e5 (estimate, not verified). A Chunk of 1200 code points is about 300–400 tokens (estimate, not verified). A Chunk near the cap of 1500 code points can be near the room of about 507 tokens. Then the header pushes it into two windows and a mean, which dilutes the vector. Controls: limit the path to the Resource name and the last two headings, or count the header in the target of the Cutter. In the Reranker, the Query, the header and the Chunk share 512 tokens; a header of 20 tokens is about 4% of the room.

## 2. Small-to-big

- **LlamaIndex `SentenceWindowNodeParser`**: one node for each sentence, with a "window" of 3 sentences on each side in the metadata (default `window_size=3`). `MetadataReplacementPostProcessor` puts the window in place of the sentence. The common recipe is `node_postprocessors=[postproc, rerank]`, so the reranker scores the window, not the sentence. [docs](https://developers.llamaindex.ai/python/framework/module_guides/querying/node_postprocessors/node_postprocessors/)
- **LlamaIndex `AutoMergingRetriever`**: a tree of 2048 / 512 / 128 tokens. It searches the leaves and gives the parent when enough of its children match. In the LlamaIndex eval it ties with the base retriever (correctness 4.27 against 4.21, pairwise 52.5%). [docs](https://developers.llamaindex.ai/python/examples/retrievers/auto_merging_retriever/)
- **LangChain `ParentDocumentRetriever`**: children of 400 characters in the vector store, parents of 2000 characters in a document store. It gives the parent. [API](https://api.python.langchain.com/en/latest/langchain/retrievers/langchain.retrievers.parent_document_retriever.ParentDocumentRetriever.html)
- **Evidence on the size**: ARAGOG ([arXiv 2404.01037](https://arxiv.org/html/2404.01037)) finds the highest retrieval precision for sentence window (window 3), but not the best answer similarity. Practitioner reports say that a window of 1 gives too little context and a window of 5 lowers groundedness (blog evidence only, not verified). A hierarchical reranker study ([arXiv 2503.02401](https://arxiv.org/pdf/2503.02401)) reranks 512-token pieces and gives their 2048-token parents.

The pattern: search small, score the small text or a window that fits the reranker, give the big text to the reader. Our Chunks are already 300–400 tokens, so they are the "big" side of most of these recipes. A neighbour does not fit in the 512-token wall of the Reranker with a full Chunk and the Query.

## 3. Late chunking

Late chunking ([arXiv 2409.04701](https://arxiv.org/html/2409.04701v3)) runs the full document through the model, then takes the mean of the token vectors of each Chunk. On BeIR it gains about 1.5–1.9 nDCG@10 points, with 8192-token models, and the gain decreases for large Chunks. Mechanically, transformers.js gives `last_hidden_state`, so the pooling is possible. But e5-small sees 512 tokens, which is one or two of our Chunks, so the gain is probably close to zero (not verified). A comparison ([arXiv 2504.19754](https://arxiv.org/abs/2504.19754)) finds it less relevant than contextual retrieval. It needs a long-context model, which is out of scope on this map.

## 4. What fits this pipeline

1. **Resource name + heading path as a header, for the embedder and the Reranker.** The Cutter already walks the sections. It can keep the heading path of each piece, also for the second and next pieces of a section. Store it on the Chunk, put it before the text for the embedding, and show it to the Reranker. Cost: a change of the cut rule and of the embedded text, so a new `cutVersion` and a new ingestion (ADR-0010). The Floor must be calibrated again on the eval, because the logits change. PDF and plain text get only the Resource name, unless the PDF outline gives headings. The header also helps a BM25 first stage.
2. **Small-to-big at read time.** After the Reranker and the Floor, give the agent the neighbours (`position` ±1) or the section of a Chunk. No new embedding. The Reranker scores the Chunk alone, because of its 512-token wall. The evidence says this helps the reader, not the retrieval.
3. **Resource name only.** The smallest step: one header for all types, no Cutter change. It separates Resources with near content, but it does not separate the sections of one Resource.
4. **Not recommended:** a summary from the first lines (very limited gains in the Anthropic report), the page in the embedded text (no meaning), late chunking (needs a long-context model).

Measure option 1 against option 3 on the eval before a decision. The evidence for the size of the gain is from single corpora and from LLM-made headers.
