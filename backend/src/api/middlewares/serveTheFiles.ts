import type {ServerResponse} from 'node:http';
import {extname} from 'node:path';
import type {ContentType} from 'contract/ContentType';
import {CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import express, {type RequestHandler} from 'express';

const MEDIA_TYPE_BY_CONTENT_TYPE: Record<ContentType, string> = {
  pdf: 'application/pdf',
  plain_text: 'text/plain; charset=utf-8',
  // text/markdown makes most browsers download the File instead of painting it.
  markdown: 'text/plain; charset=utf-8'
};

const UNKNOWN_MEDIA_TYPE = 'application/octet-stream';
const ONE_YEAR = '1y';

const mediaTypeOf = (path: string): string => {
  const contentType = CONTENT_TYPE_BY_EXTENSION.get(extname(path).toLowerCase());

  return contentType === undefined
    ? UNKNOWN_MEDIA_TYPE
    : MEDIA_TYPE_BY_CONTENT_TYPE[contentType];
};

export const serveTheFiles = (folder: string): RequestHandler =>
  express.static(folder, {
    dotfiles: 'allow',
    index: false,
    redirect: false,
    immutable: true,
    maxAge: ONE_YEAR,
    setHeaders: (response: ServerResponse, path: string): void => {
      response.setHeader('Content-Type', mediaTypeOf(path));
      response.setHeader('Content-Disposition', 'inline');
    }
  });
