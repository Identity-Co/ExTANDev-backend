import { IBanners } from "../interfaces/banner_sliders";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import fs from 'fs';
import path from 'path';

const Homepg = mongoose.model("HomePage");

// Output File path
const dirPath = path.join('public','uploads','homepage');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

try {
  fs.chmodSync(dirPath, 777);
} catch (err) {
  console.error('Failed to change permissions:', err);
}

export async function pageData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let pgData:any = [];
    // sections = await Homepg.find();

    pgData = await Homepg.findOne({});

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: pgData });
  } catch (error) {
    next(error);
  }
}

export async function getSection (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const secKey = req.params.section;

    let section:any = [];
    section = await Homepg.findOne({
      section_key: secKey,
    });
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
}

export async function updateSection (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    let body = req.body;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const oldData = await Homepg.findOne({});

    var oldAboutImage = null;
    var oldAdventureImage = null;

    if (oldData) {
      oldAboutImage = oldData.about_image;
      oldAdventureImage = oldData.adventure_image;
    }

    const about_file = (req.files as any)?.about_file?.[0];
    const adventure_file = (req.files as any)?.adventure_file?.[0];

    let about_image = (about_file != undefined) ? `uploads\\homepage\\${about_file.filename}` : oldAboutImage;
    let adventure_image = (adventure_file != undefined) ? `uploads\\homepage\\${adventure_file.filename}` : oldAdventureImage;

    const _section = await Homepg.findOneAndUpdate(
      {},
      { $set: { ...body, 'about_image': about_image, 'adventure_image': adventure_image, updated_at: new Date() } },
      { upsert: true, new: true } // upsert + return the updated doc
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _section });
  } catch (error) {
    next(error)
  }
}