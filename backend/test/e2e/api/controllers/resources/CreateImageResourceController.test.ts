import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {IMAGE_CONTENT_TYPES} from 'contract/ContentType';
import {CreateImageResourceRequest} from 'contract/CreateImageResourceRequest';
import type {ResourceRow} from 'contract/ResourceRow';
import sharp from 'sharp';
import {container} from '../../../../../src/api/config/di/Container';
import type {ImageResource} from '../../../../../src/core/resources/domain/ImageResource';
import {Checksum} from '../../../../../src/core/resources/domain/value-objects/Checksum';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {useTheTestApi} from '../../../../lib/testApi';
import {testFilesDirectory} from '../../../../lib/testInfrastructure';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';

const CREATED = 201;
const BAD_REQUEST = 400;
const CONFLICT = 409;

const FIXTURES = join(import.meta.dirname, '../../../../fixtures');

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

    // The Ingest runs after the response, so the state can have moved on.
    expect(await api.getResources()).toStrictEqual([
      expect.objectContaining({...created, ingestState: expect.any(String)})
    ]);
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
    const stored = await storeAnIngestingImageResource('the beach.png', 'the same');

    const response = await api.createImageResource('another name.png', 'the same');

    expect(response.status).toBe(CONFLICT);
    expect(await response.json()).toStrictEqual({
      errors: [
        {
          code: 'duplicate_resource',
          params: {
            resourceId: stored.id.value,
            name: 'the beach.png',
            ingestState: 'ingesting'
          }
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

  describe('the Ingest, after the response', () => {
    it.each([
      ['a-small-picture.png', 'png'],
      ['a-diagram-with-only-a-viewbox.svg', 'svg']
    ])('should make the image %s Ready', async (name, contentType) => {
      const created = await api.createAnImageResourceRow(
        name,
        await readFile(join(FIXTURES, name))
      );

      const row = await api.rowOnceIngested(created.id);

      expect(row).toMatchObject({ingestState: 'ready', contentType});
    });

    it('should have the thumbnail on the disk when the row says Ready', async () => {
      const created = await api.createAnImageResourceRow(
        'a-small-picture.png',
        await readFile(join(FIXTURES, 'a-small-picture.png'))
      );

      await api.rowOnceIngested(created.id);

      const thumbnail = await readFile(
        join(testFilesDirectory(), 'ingestion/thumbnails', `${created.id}.webp`)
      );

      expect((await sharp(thumbnail).metadata()).format).toBe('webp');
    });
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

  const storeAnIngestingImageResource = async (
    name: string,
    content: string
  ): Promise<ImageResource> => {
    const imageResource = ImageResourceBuilder.anImageResource()
      .withName(name)
      .withChecksum(Checksum.ofBytes({bytes: Buffer.from(content)}).value)
      .build();

    await container.getDependency(DrizzleResourceRepository).create(imageResource);

    return imageResource;
  };

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
