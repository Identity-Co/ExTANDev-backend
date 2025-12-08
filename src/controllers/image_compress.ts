import sharp from 'sharp';
import axios from 'axios';
import { Request, Response } from 'express';

const imageCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100; // Max number of images to cache

interface CompressQuery {
  url: string;
  width?: string;
  quality?: string;
  format?: string;
}

interface BatchOptions {
  width?: number;
  quality?: number;
  format?: string;
}

interface BatchRequest {
  urls: string[];
  options?: BatchOptions;
}

export const compressImage = async (req: Request<{}, {}, {}, CompressQuery>, res: Response) => {
  const { url, width = '1200', quality = '80', format = 'webp' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Image URL required' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const cacheKey = `${decodedUrl}-${width}-${quality}-${format}`;

    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      res.set('Content-Type', `image/${format}`);
      res.set('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    // Fetch and compress
    const response = await axios({
      method: 'GET',
      url: decodedUrl,
      responseType: 'arraybuffer',
      timeout: 15000
    });

    const compressed = await sharp(response.data)
      .resize(parseInt(width), null, { withoutEnlargement: true })
      .webp({ quality: parseInt(quality) })
      .toBuffer();

    if (imageCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }

    imageCache.set(cacheKey, {
      buffer: compressed,
      timestamp: Date.now()
    });

    res.set('X-Cache', 'MISS');
    res.set('Content-Type', `image/${format}`);
    res.send(compressed);

  } catch (error) {
    console.error('Compression failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to process image' });
  }
};


const batchCache = new Map();
const BATCH_CACHE_TTL = 60 * 60 * 1000;

export const compressBatch = async (req: Request<{}, {}, BatchRequest>, res: Response) => {
  const { urls, options = {} } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'URLs array required' });
  }

  // Generate cache key for this batch request
  const cacheKey = JSON.stringify({ urls, options });
  
  // Check cache first
  const cached = batchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < BATCH_CACHE_TTL) {
    return res.json({
      ...cached.data,
      cached: true,
      timestamp: cached.timestamp
    });
  }

  const results = [];

  // Process 3 images at a time
  for (let i = 0; i < urls.length; i += 3) {
    const batch = urls.slice(i, i + 3);
    
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          // Validate URL format
          if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL format');
          }

          // Create URL with single encoding (remove encodeURIComponent)
          const params = new URLSearchParams({
            url: url, // Single encoding - URLSearchParams will encode it
            width: options.width?.toString() || '1200',
            quality: options.quality?.toString() || '80',
            format: options.format || 'webp'
          });
          
          return {
            originalUrl: url,
            compressedUrl: `image_compress/compress/batch/?${params}`,
            status: 'success'
          };
        } catch (error) {
          return {
            originalUrl: url,
            compressedUrl: url,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    results.push(...batchResults);
  }

  const responseData = {
    success: true,
    processed: results.length,
    results,
    cached: false
  };

  // Cache the results
  batchCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  // Cleanup old cache entries occasionally
  if (batchCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of batchCache.entries()) {
      if (now - value.timestamp > BATCH_CACHE_TTL) {
        batchCache.delete(key);
      }
    }
  }

  res.json(responseData);
};