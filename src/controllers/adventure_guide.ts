import { IAdventureGuide } from "../interfaces/adventure_guide";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import fs from 'fs';
import path from 'path';
import multer from "multer";
import util from "util";

const AGuide = mongoose.model("AdventureGuide");
const User = mongoose.model("User");

// Output File path
const dirPath = path.join('public','uploads','adventure_guide');

function toArray<T = string>(v?: T | T[]): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

try {
  fs.chmodSync(dirPath, 777);
} catch (err) {
  console.error('Failed to change permissions:', err);
}

function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
}

function safeDeleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

function mergeRepeaterImages(
  rawSections: any,
  sectionFiles: (Express.Multer.File)[],
  sectionRefs: string[],
) {
  const sections = Array.isArray(rawSections) ? rawSections : [];

    sectionFiles.forEach((file, idx) => {
      const ref = sectionRefs[idx];
      if (!ref) return;

      const parts = ref.split(".").map((n) => parseInt(n, 10));
      const [sIndex, fIndex] = parts;

      if (
        Number.isFinite(sIndex) &&
        Number.isFinite(fIndex) &&
        sections[sIndex] &&
        sections[sIndex].fields &&
        sections[sIndex].fields[fIndex]
      ) {
        if (typeof file === 'string') {
          sections[sIndex].fields[fIndex].value = file;
        }else{
          sections[sIndex].fields[fIndex].value = `uploads\\adventure_guide\\${file.filename}`;
        }
      }
    });
    
  return sections;
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields } = req.query;
    
    let formData: any = [];
    let query = AGuide.find().sort({ created_at: -1 });

    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      query = query.select(fieldArray);
    }

    formData = await query;

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}

export async function homePage(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const body = req.body;
    const ids = body.ids;
    const userId = body.userId;

    let query: any = { _id: { $in: ids } };

    if (userId) {
      const user = await User.findById(userId);
      
      if (user) {
        if (user.role === 'admin') {
          // Admin sees all - no additional filters
        } else {
          query.$and = [
            { _id: { $in: ids } },
            {
              $or: [
                { posted_user: user._id.toString() },
                { post_visiblility: { $ne: "friends" } },
                ...(user.referance_id ? [{
                  post_visiblility: "friends",
                  posted_user: user.referance_id
                }] : [])
              ]
            }
          ];
        }
      } else {
        query.post_visiblility = { $ne: "friends" };
      }
    } else {
      query.post_visiblility = { $ne: "friends" };
    }

    const aguide = await AGuide.find(query);
    return res.status(config.statusCode.SUCCESS).json({ success: true, data: aguide });
  } catch (error) {
    next(error);
  }
}

export async function adv_guide(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const userId = req.body?.userId;
    let query: any = {};

    if (userId) {
      const user = await User.findById(userId);
      
      if (user) {
        if (user.role === 'admin') {
          // Empty query = all posts
        } else {
          query = {
            $or: [
              { posted_user: user._id.toString() },
              { post_visiblility: { $ne: "friends" } },
              ...(user.referance_id ? [{
                post_visiblility: "friends",
                posted_user: user.referance_id
              }] : [])
            ]
          };
        }
      } else {
        query.post_visiblility = { $ne: "friends" };
      }
    } else {
      query.post_visiblility = { $ne: "friends" };
    }

    const aguide = await AGuide.find(query);
    return res.status(config.statusCode.SUCCESS).json({ success: true, data: aguide });
  } catch (error) {
    next(error);
  }
}

export async function getAdventureGuide(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await AGuide.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "AdventureGuide not found",
        "getAdventureGuide"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function getAdventureGuideBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pageSlug = req.body?.slug;
    const userId = req.body?.userId;

    let pipeline: any[] = [
      { $match: { page_url: pageSlug } }
    ];

    if (userId) {
      const user = await User.findById(userId);
      
      if (user) {
        if (user.role !== 'admin') {
          const visibilityFilter = {
            $or: [
              { posted_user: user._id.toString() },
              { post_visiblility: { $ne: "friends" } },
              ...(user.referance_id ? [{
                post_visiblility: "friends",
                posted_user: user.referance_id
              }] : [])
            ]
          };
          
          pipeline.push({ $match: visibilityFilter });
        }
      } else {
        pipeline.push({ $match: { post_visiblility: { $ne: "friends" } } });
      }
    } else {
      pipeline.push({ $match: { post_visiblility: { $ne: "friends" } } });
    }

    const data = await AGuide.aggregate(pipeline);
    const result = data[0];

    if (!result) {
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "AdventureGuide not found",
        "getAdventureGuideBySlug"
      );
    }

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createAdventureGuide(req: Request, res: Response, next: NextFunction) {
  try {

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Text body: content_sections is JSON string if sent via FormData
    const body = req.body as any;
    const parsedSections = body.content_sections ? JSON.parse(body.content_sections) : [];

    // Single images
    if (files?.feature_image?.[0]) body.feature_image = `uploads\\adventure_guide\\${files.feature_image[0].filename}`;
    if (files?.banner_image?.[0]) body.banner_image = `uploads\\adventure_guide\\${files.banner_image[0].filename}`;
    if (files?.author_image?.[0]) body.author_image = `uploads\\adventure_guide\\${files.author_image[0].filename}`;
    if (files?.site_logo?.[0]) body.site_logo = `uploads\\adventure_guide\\${files.site_logo[0].filename}`;

    // Repeater images
    const sectionFiles = files?.section_images || [];
    const sectionRefs = toArray<string>(body.section_refs);
    body.content_sections = mergeRepeaterImages(parsedSections, sectionFiles, sectionRefs);

    let uniqueSlug = body.page_url
    let counter = 1;
    while (await AGuide.findOne({ page_url: uniqueSlug })) {
      uniqueSlug = `${body.page_url}-${counter}`
      counter++
    }

    body.page_url = uniqueSlug;

    //const guide = await AGuide.create(newData);

    const guide = await AGuide.create({
      ...body,
    });
    return res.status(config.statusCode.SUCCESS).json({ success: true, data: guide });
  } catch (error) {
    next(error);
  }
}

export async function updateAdventureGuide(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const uploadDir = path.join('public', 'uploads', 'adventure_guide');
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const _id = new Types.ObjectId(req.params.id);
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse request data
    let body = req.body;
    /*if (typeof req.body.data === 'string') {
      body = JSON.parse(req.body.data);
    }*/

    const parsedSections = body.content_sections ? 
      (typeof body.content_sections === 'string' ? 
        JSON.parse(body.content_sections) : 
        body.content_sections) : 
      [];

    // Find existing adventure guide
    const adventureGuide = await AGuide.findById(_id);
    if (!adventureGuide) {
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "AdventureGuide not found",
        "updateAdventureGuide"
      );
    }

    const updateData: any = { ...body };

    // Process file uploads for main images
    const fileFields = [
      'feature_image',
      'banner_image', 
      'author_image',
      'site_logo'
    ] as const;

    for (const fieldName of fileFields) {
      const file = files?.[fieldName]?.[0];
      const currentValue = adventureGuide[fieldName];
      
      if (file) {
        const relativePath = path.join('uploads', 'adventure_guide', file.filename).replace(/\\/g, '/');
        updateData[fieldName] = relativePath;
        
        // Clean up old file if it exists and is different
        if (currentValue && currentValue !== relativePath) {
          const oldFilePath = path.join('public', currentValue);
          safeDeleteFile(oldFilePath);
        }
      }
    }

    // Process section images (base64 and regular uploads)
    const sectionFiles = files?.section_images || [];
    let count = 0;
    for (const section of parsedSections) {
      if (section.fields && Array.isArray(section.fields)) {
        for (const field of section.fields) {
          if (field.type === 'image' && field.value && isBase64Image(field.value)) {
            try {
              const newFile = sectionFiles[count];
              field.value = `uploads\\adventure_guide\\${newFile.filename}`
              count++;
              
            } catch (error) {
              console.error('Error processing base64 image:', error);
            }
          }
        }
      }
    }

    let uniqueSlug = updateData.page_url
    let counter = 1;
    while (
      await AGuide.findOne({
        page_url: uniqueSlug,
        _id: { $ne: _id }
      })
    ) {
      uniqueSlug = `${updateData.page_url}-${counter}`;
      counter++;
    }

    updateData.page_url = uniqueSlug;
    updateData.content_sections = parsedSections;

    const updatedGuide = await AGuide.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: updatedGuide,
      message: 'Adventure guide updated successfully'
    });

  } catch (error) {
    console.error('Error in updateAdventureGuide:', error);
    next(error);
  }
}

export async function deleteAdventureGuide (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const banner = await AGuide.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "AdventureGuide with this id not found",
        "deleteAdventureGuide"
      );

    const _del = await AGuide.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, banner });
  } catch (error) {
    next(error)
  }
}

export async function listByCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields, userid } = req.query;

    let formData: any = [];
    let query = AGuide.find().sort({ created_at: -1 });

    if (userid && typeof userid === 'string') {
      query = query.where('posted_user').equals(userid);
    }

    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      query = query.select(fieldArray);
    }
    
    formData = await query;

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}