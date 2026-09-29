import type {RequestHandler} from 'express';
import multer from 'multer';

export const takeTheFiles = (filePart: string): RequestHandler =>
  multer({storage: multer.memoryStorage()}).array(filePart);
