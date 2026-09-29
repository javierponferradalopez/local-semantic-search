import {readFile, rm, writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {basename, dirname, join} from 'node:path';
import {useTheTestApi} from '../../../lib/testApi';
import {testFilesDirectory} from '../../../lib/testInfrastructure';

const OK = 200;
const NOT_FOUND = 404;

const FIXTURES = new URL('../../../fixtures/', import.meta.url);

describe('GET the fileUrl of a row', () => {
  const api = useTheTestApi();

  it.each([
    ['two-pages-with-text.pdf', 'application/pdf'],
    ['markdown-with-headings.md', 'text/plain; charset=utf-8'],
    ['long-text.txt', 'text/plain; charset=utf-8']
  ])('should serve %s inline, as %s, and immutable', async (name, contentType) => {
    const bytes = await readFile(new URL(name, FIXTURES));
    const row = await api.createATextResourceRow(name, bytes);

    const response = await fetch(`${api.origin()}${row.fileUrl}`);

    expect(response.status).toBe(OK);
    expect(response.headers.get('content-type')).toBe(contentType);
    expect(response.headers.get('content-disposition')).toBe('inline');
    expect(response.headers.get('cache-control')).toContain('immutable');
    expect(Buffer.from(await response.arrayBuffer())).toStrictEqual(bytes);
  });

  it.each([
    ['the beach.jpg', 'image/jpeg'],
    ['the beach.jpeg', 'image/jpeg'],
    ['the screenshot.png', 'image/png'],
    ['the beach.webp', 'image/webp'],
    ['the loop.gif', 'image/gif'],
    ['the beach.avif', 'image/avif'],
    ['the diagram.svg', 'image/svg+xml']
  ])('should serve the image %s inline, as %s', async (name, contentType) => {
    const bytes = Buffer.from(`the bytes of ${name}`);
    const row = await api.createAnImageResourceRow(name, bytes);

    const response = await fetch(`${api.origin()}${row.fileUrl}`);

    expect(response.status).toBe(OK);
    expect(response.headers.get('content-type')).toBe(contentType);
    expect(response.headers.get('content-disposition')).toBe('inline');
    expect(Buffer.from(await response.arrayBuffer())).toStrictEqual(bytes);
  });

  it('should serve an SVG with no sandbox and as it is, script and all (ADR-0004)', async () => {
    const bytes = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    );
    const row = await api.createAnImageResourceRow('the diagram.svg', bytes);

    const response = await fetch(`${api.origin()}${row.fileUrl}`);

    expect(response.headers.get('content-security-policy')).toBeNull();
    expect(Buffer.from(await response.arrayBuffer())).toStrictEqual(bytes);
  });

  describe('a path that tries to leave the folder the application owns', () => {
    const secret = join(
      dirname(testFilesDirectory()),
      `${basename(testFilesDirectory())}-secret.txt`
    );

    beforeAll(async () => {
      await writeFile(secret, 'the secret');
    });

    afterAll(async () => {
      await rm(secret, {force: true});
    });

    it.each(['..%2F', '%2e%2e/', '..%5C'])(
      'should be refused when it climbs with %s',
      async climb => {
        const {status, body} = await getTheRawPath(`/files/${climb}${basename(secret)}`);

        expect(status).toBe(NOT_FOUND);
        expect(body).not.toContain('the secret');
      }
    );
  });

  const getTheRawPath = (
    path: string
  ): Promise<{status: number | undefined; body: string}> =>
    new Promise((resolve, reject) => {
      const outgoing = request(api.origin(), {path});

      outgoing.on('error', reject);
      outgoing.on('response', incoming => {
        let body = '';

        incoming.setEncoding('utf8');
        incoming.on('data', chunk => {
          body += chunk;
        });
        incoming.on('end', () => resolve({status: incoming.statusCode, body}));
      });
      outgoing.end();
    });
});
