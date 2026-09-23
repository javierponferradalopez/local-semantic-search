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
