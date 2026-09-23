import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import multer from 'multer';

export const takeOneFile = multer({storage: multer.memoryStorage()}).single(
  CreateTextResourceRequest.filePart
);
