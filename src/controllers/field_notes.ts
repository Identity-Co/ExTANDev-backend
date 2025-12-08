import { IFieldNotes } from "../interfaces/field_notes";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import fs from 'fs';
import path from 'path';

const FNotes = mongoose.model("FieldNotes");

// Output File path
const dirPath = path.join('public','uploads','field_notes');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('Directory created');
}

try {
  fs.chmodSync(dirPath, 777);
} catch (err) {
  console.error('Failed to change permissions:', err);
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let fnotes:any = [];
    fnotes = await FNotes.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: fnotes });
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

    var fnotes = [];

    if(ids.length) {
      fnotes = await FNotes.find({
        _id: { $in: ids }
      });
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: fnotes });
  } catch (error) {
    next(error);
  }
}

export async function getFieldNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await FNotes.findOne({
      _id: _id,
    });

    console.log(_id, data);

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "FieldNote not found",
        "getFieldNote"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createFieldNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const checkBanner = await FNotes.findOne({
      title: body.title,
    });
    if (checkBanner) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "FieldNote already exist",
        "createFieldNote"
      );
    }
    

    const banner = await FNotes.create({
      ...req.body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
}

export async function updateFieldNote (
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

    const banner = await FNotes.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "FieldNote not exist",
        "updateFieldNote"
      );

    let image = (file != undefined) ? `uploads\\\\${file.filename}` : null;

    if(banner && banner.banner_image !== undefined && file === undefined)
      image = banner.banner_image;
    
    const _banner = await FNotes.findByIdAndUpdate(
        _id,
        { ...body, 'banner_image': image },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _banner });
  } catch (error) {
    next(error)
  }
}

export async function deleteFieldNote (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const banner = await FNotes.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "FieldNote with this id not found",
        "deleteFieldNote"
      );

    const _del = await FNotes.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, banner });
  } catch (error) {
    next(error)
  }
}