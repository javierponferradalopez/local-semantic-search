import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import multer from 'multer';

export const takeTheFiles = multer({storage: multer.memoryStorage()}).array(
  CreateTextResourceRequest.filePart
);
