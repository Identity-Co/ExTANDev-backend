import { Request } from 'express';

export interface UploadRequest extends Request {
  file: Express.Multer.File;
}