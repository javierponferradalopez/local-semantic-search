import {readFile} from 'node:fs/promises';
import {request} from 'node:http';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import {INGEST_STATES} from 'contract/IngestState';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {container} from '../../../../../src/api/config/di/Container';
import type {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {Checksum} from '../../../../../src/core/resources/domain/value-objects/Checksum';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {useTheTestApi} from '../../../../lib/testApi';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';

const CREATED = 201;
const BAD_REQUEST = 400;
const CONFLICT = 409;
const CONTENT_TOO_LARGE = 413;

const FIELDS_OF_A_ROW = [
  'contentType',
  'createdAt',
  'fileUrl',
  'id',
  'ingestState',
  'name'
];

describe('POST /resources/texts', () => {
  const api = useTheTestApi();

  it('should give 201 and the row of the Resource in Ingesting', async () => {
    const response = await api.createTextResource('the notes.md', 'the notes');

    expect(response.status).toBe(CREATED);

    const row = (await response.json()) as ResourceRow;

    expect(row.name).toBe('the notes.md');
    expect(row.contentType).toBe('markdown');
    expect(row.ingestState).toBe('ingesting');
  });

  it('should give a row that obeys the types that contract/ declares', async () => {
    const response = await api.createTextResource('the notes.md', 'the notes');

    expect(response.status).toBe(CREATED);
    expectAResourceRow(await response.json());
  });

  describe('the Ingest, after the response', () => {
    it('should make a text file Ready', async () => {
      const created = await api.createATextResourceRow(
        'long-text.txt',
        await readFile(join(import.meta.dirname, '../../../../fixtures/long-text.txt'))
      );

      const row = await api.rowOnceIngested(created.id);

      expect(row.ingestState).toBe('ready');
      expectAResourceRow(row);
    });

    it('should make a Markdown file Ready', async () => {
      const created = await api.createATextResourceRow(
        'markdown-with-headings.md',
        await readFile(
          join(import.meta.dirname, '../../../../fixtures/markdown-with-headings.md')
        )
      );

      const row = await api.rowOnceIngested(created.id);

      expect(row.ingestState).toBe('ready');
      expectAResourceRow(row);
    });

    it('should make a PDF with text Ready', async () => {
      const created = await api.createATextResourceRow(
        'two-pages-with-text.pdf',
        await readFile(
          join(import.meta.dirname, '../../../../fixtures/two-pages-with-text.pdf')
        )
      );

      const row = await api.rowOnceIngested(created.id);

      expect(row.ingestState).toBe('ready');
      expectAResourceRow(row);
    });
  });

  it('should give 409 and duplicate_resource for the same bytes', async () => {
    const stored = await storeAnIngestingTextResource('the notes.md', 'the same');

    const response = await api.createTextResource('another name.md', 'the same');

    expect(response.status).toBe(CONFLICT);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      errors: [
        {
          code: 'duplicate_resource',
          params: {
            resourceId: stored.id.value,
            name: 'the notes.md',
            ingestState: 'ingesting'
          }
        }
      ]
    } satisfies ApiError);
  });

  it('should leave one Resource alone when the same bytes arrive twice', async () => {
    await api.createTextResource('the notes.md', 'the same');
    await api.createTextResource('another name.md', 'the same');

    expect(await api.getResources()).toHaveLength(1);
  });

  it('should take a file with the same name and different bytes', async () => {
    await api.createTextResource('the notes.md', 'the first');
    const response = await api.createTextResource('the notes.md', 'the second');

    expect(response.status).toBe(CREATED);
    expect(await api.getResources()).toHaveLength(2);
  });

  describe('the Gate', () => {
    it('should give 400 and unsupported_content_type for a name that names no Content type', async () => {
      const response = await api.createTextResource('the notes.docx', 'the notes');

      expect(response.status).toBe(BAD_REQUEST);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(await response.json()).toStrictEqual({
        errors: [{code: 'unsupported_content_type', params: {name: 'the notes.docx'}}]
      } satisfies ApiError);
      await api.expectNothingStored();
    });

    it('should judge the Content type by the name, and never by the declared MIME type', async () => {
      const refused = await api.createTextResource(
        'the notes.docx',
        'the notes',
        'text/plain'
      );
      const created = await api.createTextResource(
        'the notes.md',
        'the notes',
        'application/pdf'
      );

      expect(refused.status).toBe(BAD_REQUEST);
      expect(((await created.json()) as ResourceRow).contentType).toBe('markdown');
    });

    it('should give 413 and file_too_large from the Content-Length, before the body arrives', async () => {
      const sizeInBytes = MAXIMUM_FILE_SIZE_IN_BYTES + 1;

      const {status, body} = await postOnlyTheHeaders(sizeInBytes);

      expect(status).toBe(CONTENT_TOO_LARGE);
      expect(body).toStrictEqual({
        errors: [
          {
            code: 'file_too_large',
            params: {sizeInBytes, limitInBytes: MAXIMUM_FILE_SIZE_IN_BYTES}
          }
        ]
      } satisfies ApiError);
      await api.expectNothingStored();
    });

    it('should give 400 and multiple_files with the number of files that arrived', async () => {
      const body = new FormData();

      body.append(CreateTextResourceRequest.filePart, new File(['the first'], 'a.md'));
      body.append(CreateTextResourceRequest.filePart, new File(['the second'], 'b.md'));

      const response = await fetch(`${api.origin()}/resources/texts`, {
        method: 'POST',
        body
      });

      expect(response.status).toBe(BAD_REQUEST);
      expect(await response.json()).toStrictEqual({
        errors: [{code: 'multiple_files', params: {count: 2}}]
      } satisfies ApiError);
      await api.expectNothingStored();
    });
  });

  const postOnlyTheHeaders = (
    contentLength: number
  ): Promise<{status: number | undefined; body: unknown}> =>
    new Promise((resolve, reject) => {
      const outgoing = request(`${api.origin()}/resources/texts`, {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data; boundary=the-boundary',
          'content-length': contentLength
        }
      });

      outgoing.on('error', reject);
      outgoing.on('response', incoming => {
        let text = '';

        incoming.setEncoding('utf8');
        incoming.on('data', chunk => {
          text += chunk;
        });
        incoming.on('end', () => {
          outgoing.destroy();
          resolve({status: incoming.statusCode, body: JSON.parse(text)});
        });
      });
      outgoing.flushHeaders();
    });

  // Written straight to the store, so no event starts an Ingest and the row stays Ingesting.
  const storeAnIngestingTextResource = async (
    name: string,
    content: string
  ): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource()
      .withName(name)
      .withChecksum(Checksum.ofBytes({bytes: Buffer.from(content)}).value)
      .build();

    await container.getDependency(DrizzleResourceRepository).create(textResource);

    return textResource;
  };

  const expectAResourceRow = (value: unknown): void => {
    const row = value as ResourceRow;
    const fields = Object.keys(row).toSorted();

    expect(typeof row.id).toBe('string');
    expect(typeof row.name).toBe('string');
    expect(typeof row.fileUrl).toBe('string');
    expect(CONTENT_TYPES).toContain(row.contentType);
    expect(INGEST_STATES).toContain(row.ingestState);
    expect(new Date(row.createdAt).toISOString()).toBe(row.createdAt);

    if (row.ingestState === 'failed') {
      expect(REASON_CODES).toContain(row.reason);
      expect(fields).toStrictEqual([...FIELDS_OF_A_ROW, 'reason'].toSorted());

      return;
    }

    expect(fields).toStrictEqual(FIELDS_OF_A_ROW.toSorted());
  };
});
