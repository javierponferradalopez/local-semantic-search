import type {ApiError} from 'contract/ApiError';
import {IMAGE_CONTENT_TYPES} from 'contract/ContentType';
import {CreateImageResourceRequest} from 'contract/CreateImageResourceRequest';
import type {ResourceRow} from 'contract/ResourceRow';
import {useTheTestApi} from '../../../../lib/testApi';

const CREATED = 201;
const BAD_REQUEST = 400;
const CONFLICT = 409;

const FIELDS_OF_A_ROW = [
  'contentType',
  'createdAt',
  'fileUrl',
  'id',
  'ingestState',
  'name'
];

describe('POST /resources/images', () => {
  const api = useTheTestApi();

  it('should give 201 and the row of the Resource in Ingesting', async () => {
    const response = await api.createImageResource('the beach.png', 'the beach');

    expect(response.status).toBe(CREATED);

    const row = (await response.json()) as ResourceRow;

    expect(row.name).toBe('the beach.png');
    expect(row.contentType).toBe('png');
    expect(row.ingestState).toBe('ingesting');
  });

  it('should give a row that obeys the types that contract/ declares', async () => {
    const response = await api.createImageResource('the beach.png', 'the beach');

    expect(response.status).toBe(CREATED);
    expectAnImageResourceRow(await response.json());
  });

  it('should give the row through GET /resources', async () => {
    const created = await api.createAnImageResourceRow('the beach.png', 'the beach');

    expect(await api.getResources()).toStrictEqual([created]);
  });

  it.each([
    ['the beach.jpg', 'jpeg'],
    ['the beach.jpeg', 'jpeg'],
    ['the screenshot.png', 'png'],
    ['the beach.webp', 'webp'],
    ['the loop.gif', 'gif'],
    ['the beach.avif', 'avif'],
    ['the diagram.svg', 'svg']
  ])('should take %s as the Content type %s', async (name, contentType) => {
    const row = await api.createAnImageResourceRow(name, `the bytes of ${name}`);

    expect(row.contentType).toBe(contentType);
  });

  it('should give 409 and duplicate_resource for the same bytes', async () => {
    const stored = await api.createAnImageResourceRow('the beach.png', 'the same');

    const response = await api.createImageResource('another name.png', 'the same');

    expect(response.status).toBe(CONFLICT);
    expect(await response.json()).toStrictEqual({
      errors: [
        {
          code: 'duplicate_resource',
          params: {resourceId: stored.id, name: 'the beach.png', ingestState: 'ingesting'}
        }
      ]
    } satisfies ApiError);
  });

  it('should keep the same bytes as a text and as an image as two Resources', async () => {
    await api.createTextResource('the beach.txt', 'the same');
    const response = await api.createImageResource('the beach.png', 'the same');

    expect(response.status).toBe(CREATED);
    expect(
      (await api.getResources()).map(row => row.contentType).toSorted()
    ).toStrictEqual(['plain_text', 'png']);
  });

  describe('the Gate', () => {
    it.each(['the notes.pdf', 'the notes.txt', 'the notes.md'])(
      'should give 400 and unsupported_content_type for the text %j',
      async name => {
        const response = await api.createImageResource(name, 'the notes');

        expect(response.status).toBe(BAD_REQUEST);
        expect(await response.json()).toStrictEqual({
          errors: [{code: 'unsupported_content_type', params: {name}}]
        } satisfies ApiError);
        await api.expectNothingStored();
      }
    );

    it.each(['the scan.tiff', 'the photo.heic'])(
      'should give 400 and unsupported_content_type for %j, which the browser or sharp cannot take',
      async name => {
        const response = await api.createImageResource(name, 'the picture');

        expect(response.status).toBe(BAD_REQUEST);
        await api.expectNothingStored();
      }
    );

    it('should give 400 and multiple_files with the number of files that arrived', async () => {
      const body = new FormData();

      body.append(CreateImageResourceRequest.filePart, new File(['the first'], 'a.png'));
      body.append(CreateImageResourceRequest.filePart, new File(['the second'], 'b.png'));

      const response = await fetch(`${api.origin()}/resources/images`, {
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

  const expectAnImageResourceRow = (value: unknown): void => {
    const row = value as ResourceRow;

    expect(typeof row.id).toBe('string');
    expect(typeof row.name).toBe('string');
    expect(typeof row.fileUrl).toBe('string');
    expect(IMAGE_CONTENT_TYPES).toContain(row.contentType);
    expect(row.ingestState).toBe('ingesting');
    expect(new Date(row.createdAt).toISOString()).toBe(row.createdAt);
    expect(Object.keys(row).toSorted()).toStrictEqual(FIELDS_OF_A_ROW.toSorted());
  };
});
