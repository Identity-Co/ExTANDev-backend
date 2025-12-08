import { IBanners } from "../interfaces/banner_sliders";
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

const Pages = mongoose.model("Pages");
const PageData = mongoose.model("PageData");

// Output File path
const dirPath = path.join('public','uploads','pages');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('Directory created');
}

try {
  fs.chmodSync(dirPath, 777);
  // console.log('Permissions changed to 777');
} catch (err) {
  console.error('Failed to change permissions:', err);
}

function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
}


export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let pages:any = [];
    pages = await Pages.find({
      status: 1,
      is_delete: 0
    });
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: pages });
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
    const _page = req.params.pg;

    const page = await Pages.find({
      page: _page
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

export async function getPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await Pages.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page not found",
        "getPage"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const pageBanner = await Pages.findOne({
      name: body.name,
    });
    /*if (pageBanner) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "Page already exist",
        "createPage"
      );
    }*/
    
    const page = await Pages.create({
      ...req.body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
}

export async function updatePage (
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

    const page = await Pages.findOne({
      _id: _id,
    });

    if (!page)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Banner not exist",
        "updateBanner"
      );

    let image = (file != undefined) ? `uploads\\\\${file.filename}` : null;

    if(page && page.banner_image !== undefined && file === undefined)
      image = page.banner_image;
    
    const _page = await Pages.findByIdAndUpdate(
        _id,
        { ...body, 'banner_image': image },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _page });
  } catch (error) {
    next(error)
  }
}

export async function getPageData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _pg = req.params.pg;
    const data = await PageData.findOne({
      name: _pg,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page not found",
        "getPage"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function updatePageData (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const _pg = req.params.pg;
    let body = req.body;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }
    
    const files = req.files;

    var updated_data = { ...body };

    let image_arr: { [key: string]: any } = {};

    
    const validPages = ['Ambassadorship', 'Adventure Guide', 'Contact Us'];

    const allFiles = req.files as Express.Multer.File[];

    const old_page = await PageData.findOne({ name: _pg });
    let updatedeImgData = { $set: {} as any };

    var bannerImage = req.body.banner_image??old_page.banner_image
    if (validPages.includes(_pg)) {
      bannerImage = body.banner_image;
      if (old_page) {
        //updated_data = old_page;
        if(files !== undefined){
          if (Array.isArray(files)/* && 'banner_image_file' in files*/) {
            const bannerFile = allFiles.find(f => f.fieldname === "banner_image_file");
            if(bannerFile !== undefined) bannerImage = path.join('uploads', 'pages', bannerFile?.filename)

              updatedeImgData.$set.banner_image = bannerImage;
              //updated_data = { $set: { 'banner_image': bannerImage } };
              updated_data = {
                ...updated_data,
                ...updatedeImgData
              };
          }
        }
      }
    }

    if(_pg == 'Contact Us') {
      let ctaBackground = body.cta_background;
      if (old_page) {
        if(files !== undefined){
          if (Array.isArray(files)/* && 'banner_image_file' in files*/) {
            const ctaBackgroundFile = allFiles.find(f => f.fieldname === "cta_background_file");
            if(ctaBackgroundFile !== undefined) ctaBackground = path.join('uploads', 'pages', ctaBackgroundFile?.filename)

              updatedeImgData.$set.cta_background = ctaBackground;
              //updated_data = { $set: { 'cta_background': ctaBackground } };
              updated_data = {
                ...updated_data,
                ...updatedeImgData
              };
          }
        }
      }
    }

    if(_pg == 'Total Travel') {
      const old_page = await PageData.findOne({ name: _pg });

      if (files!==undefined) {
          if (old_page && (files===undefined /*|| files.length == 0*/)) {
            let travel_sections = old_page.travel_sections;
            let i = 0;
            old_page.travel_sections.forEach((item: any) => {
              travel_sections[i]['title'] = updated_data.travel_sections[i].title;
              travel_sections[i]['content'] = updated_data.travel_sections[i].content;
              travel_sections[i]['direction'] = updated_data.travel_sections[i].direction;
              travel_sections[i]['image'] = item.image;
              i++;
            })

            updated_data.travel_sections = travel_sections;
          } else if (old_page && files!==undefined) {
            if (Array.isArray(files)) {
              updated_data = old_page;
              files.forEach((file: any) => {
                const match = file.fieldname.match(/image\[(\d+)\]\[image\]/);
                if (match) {
                  const index = parseInt(match[1], 10);

                  // Store the file object in the corresponding section
                  var image = null;
                  if (req.body.img_update) {
                    image = `uploads\\pages\\${file.filename}`;
                  } else {
                    image = old_page.travel_sections[index].image;
                  }

                  image_arr["travel_sections."+index+".image"] = image;
                }

                updated_data = { $set: image_arr };
              });
            }
          }         
      }

    }
    // return
    const _page = await PageData.findOneAndUpdate(
      { name: _pg },   // filter
      updated_data,     // update data
      { new: true, upsert: true } // return updated doc & create if not exist
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _page });
  } catch (error) {
    next(error)
  }
}

export async function deletePage (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const page = await Pages.findOne({
      _id: _id,
    });

    if (!page)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page with this id not found",
        "deletePage"
      );

    const _del = await Pages.findByIdAndUpdate(
        _id,
        { 'is_delete': 1 },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, page });
  } catch (error) {
    next(error)
  }
}

export async function createStaticPageData (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {

    let body = req.body as any;

    if(body.banner_image && isBase64Image(body.banner_image)){
      const matches = body.banner_image.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const base64Data = matches[2];

      const buffer = Buffer.from(base64Data, "base64");
      const uniqueName = `${Date.now()}-${body.banner_image_file}`;
      const savePath = path.join('public', 'uploads', 'pages', uniqueName)

      fs.writeFileSync(savePath, buffer);

      body.banner_image = `uploads\\pages\\${uniqueName}`;
    }

    let uniqueSlug = body.page_url
    let counter = 1;
    while (await PageData.findOne({ page_url: uniqueSlug })) {
      uniqueSlug = `${body.page_url}-${counter}`
      counter++
    }
    body.page_url = uniqueSlug;

    const _page = await PageData.create({
      ...body,
    });

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _page });
  } catch (error) {
    next(error)
  }
}

export async function updateStaticPageData (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const idParam = req.params.id;

    const _id = new Types.ObjectId(idParam);

    let body = req.body as any;

    var updated_data: any = { ...body };

    const old_page = await PageData.findOne({ name: _id });

    if (old_page) {
      updated_data = old_page;
    }

    if(body.banner_image && isBase64Image(body.banner_image)){
      const matches = body.banner_image.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const base64Data = matches[2];
      
      const buffer = Buffer.from(base64Data, "base64");
      const uniqueName = `${Date.now()}-${body.banner_image_file}`;
      const savePath = path.join('public', 'uploads', 'pages', uniqueName)

      fs.writeFileSync(savePath, buffer);

      updated_data.banner_image = `uploads\\pages\\${uniqueName}`;
    }

    let uniqueSlug = updated_data.page_url
    let counter = 1;
    while (
      await PageData.findOne({
        page_url: uniqueSlug,
        _id: { $ne: _id }
      })
    ) {
      uniqueSlug = `${updated_data.page_url}-${counter}`;
      counter++;
    }

    updated_data.page_url = uniqueSlug;

    const _page = await PageData.findOneAndUpdate(
      { _id: _id },
      updated_data,
      { new: true, upsert: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _page });
  } catch (error) {
    next(error)
  }
}

export async function getStaticPageData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await PageData.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page not found",
        "getPage"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function getStaticPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try { 
    const _pg = req.params.pg;
    const data = await Pages.findOne({
      pge_id: _pg,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page not found",
        "getStaticPage"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}


export async function getPageBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _slug = req.params.slug;
    const data = await PageData.findOne({
      page_url: _slug,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Page not found",
        "getPageBySlug"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}