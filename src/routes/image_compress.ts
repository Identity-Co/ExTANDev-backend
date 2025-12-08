// routes/imageRoutes.js
import express from 'express';
import { compressImage, compressBatch } from '../controllers/image_compress';

const router = express.Router();

router.get('/compress', compressImage);
router.post('/compress/batch', compressBatch);

export default router;