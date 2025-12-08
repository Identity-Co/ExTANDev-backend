import { ICustomCategories } from "../interfaces/tours";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const CustomCategories = mongoose.model("CustomCategories");

import fs from 'fs';
import path from 'path';

// Output File path
const dirPath = path.join('public','uploads','custom_category');

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
    let custom_categories:any = [];
    custom_categories = await CustomCategories.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: custom_categories });
  } catch (error) {
    next(error);
  }
}

export async function getCustomCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await CustomCategories.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Category not found",
        "getCustomCategory"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createCustomCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const file = req.file;

    const checkCategory = await CustomCategories.findOne({
      category_name: body.category_name,
    });

    if (checkCategory) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "Category already exist",
        "createCustomCategory"
      );
    }

    const custom_category = await CustomCategories.create({
      ...req.body,
      "image": (file !== undefined ? 'uploads\\custom_category\\'+file?.filename : null)
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: custom_category });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomCategory (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const _id = new Types.ObjectId(req.params.id);
    let body = req.body;
    const file = req.file;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const custom_category = await CustomCategories.findOne({
      _id: _id,
    });

    if (!custom_category)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Category not exist",
        "updateCategory"
      );

    const image = (file !== undefined) ? 'uploads\\custom_category\\'+file?.filename : custom_category.image;

    const checkCategory = await CustomCategories.findOne({
      category_name: body.category_name,
      _id: { $ne: _id }
    });

    if (checkCategory) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "Category already exist",
        "createCustomCategory"
      );
    }

    const _custom_category = await CustomCategories.findByIdAndUpdate(
        _id,
        { ...body, image: image },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _custom_category });
  } catch (error) {
    next(error)
  }
}

export async function deleteCustomCategory (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const custom_category = await CustomCategories.findOne({
      _id: _id,
    });

    if (!custom_category)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Category with this id not found",
        "delete category data"
      );

    const _del = await CustomCategories.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, custom_category });
  } catch (error) {
    next(error)
  }
}