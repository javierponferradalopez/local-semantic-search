# System design practice: a URL shortener

A classic interview problem. I practise it out loud in 35 minutes.

## Requirements

- Make a short link from a long URL, and redirect from the short link to the URL.
- 100 million new links a month; 100 reads for each write.
- A link lives five years.

## The design

1. **The key.** Seven characters of base62 give 3.5 trillion keys. A counter in
   the database gives each new link a number, and the number becomes base62. No
   hash, so no collision.
2. **The store.** One table: key, long URL, creation date. A key-value store
   scales well, because each read is by the key.
3. **The redirect.** A 302, not a 301, so that each click reaches us and we can
   count it.
4. **The cache.** The links that people click most stay in a cache in memory. The
   reads are 100 times the writes, so the cache takes most of the load.
5. **The numbers.** 100 million links a month for five years is 6 billion rows,
   about 3 TB with the indexes.

## What the interviewer asks next

- How to stop a user who makes millions of links: a limit for each account.
- How to delete the old links: a job each night that removes the expired keys.
