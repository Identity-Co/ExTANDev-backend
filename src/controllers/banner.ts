import { IBanners } from "../interfaces/banner_sliders";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import fs from 'fs';
import path from 'path';

const Banners = mongoose.model("BannerSliders");

// Output File path
const dirPath = path.join('public','uploads','banners');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('Directory created');
}

try {
  fs.chmodSync(dirPath, 777);
  console.log('Permissions changed to 777');
} catch (err) {
  console.error('Failed to change permissions:', err);
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const banners = await Banners.find().sort({ page: 1, created_at: -1 });
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
}

export async function listAllByPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const page = req.params.pg;

    const banners = await Banners.find({
      page: page
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
}

export async function getBanner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await Banners.findOne({
      _id: _id,
    });

    console.log(_id, data);

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Banenr not found",
        "getBanner"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createBanner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const checkBanner = await Banners.findOne({
      title: body.title,
    });
    if (checkBanner) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "Banner already exist",
        "createUser"
      );
    }
    

    const banner = await Banners.create({
      ...req.body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
}

export async function updateBanner (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const _id = new Types.ObjectId(req.params.id);
    let body = req.body;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const file = req.file;

    const banner = await Banners.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Banner not exist",
        "updateBanner"
      );

    var oldImage = null;
    if (banner) {
      oldImage = banner.banner_image;
    }

    let image = (file != undefined) ? `uploads\\\\banners\\\\${file.filename}` : oldImage;

    if(banner && banner.banner_image !== undefined && file === undefined)
      image = banner.banner_image;
    
    const _banner = await Banners.findByIdAndUpdate(
        _id,
        { ...body, 'banner_image': image },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _banner });
  } catch (error) {
    next(error)
  }
}

export async function deleteBanner (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const banner = await Banners.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Agent with this id not found",
        "delete user data"
      );

    const _del = await Banners.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, banner });
  } catch (error) {
    next(error)
  }
}