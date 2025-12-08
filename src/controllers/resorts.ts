import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

import fs from 'fs';
import path from 'path';
import multer from "multer";
import util from "util";

const Resorts = mongoose.model("Resorts");

// Output File path
const dirPath = path.join('public','uploads','resorts');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

try {
  fs.chmodSync(dirPath, 777);
} catch (err) {
  console.error('Failed to change permissions:', err);
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

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields } = req.query;
    
    let query = Resorts.find().sort({ created_at: -1 });

    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map((field: any) => field.trim());
      query = query.select(fieldArray);
    }

    query = query.populate({
      path: 'posted_user',
      select: 'first_name last_name email',
    });

    const formData = await query;

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}

export async function listAllByUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields, posted_user } = req.query;
    
    let formData: any = [];
    let query = Resorts.find().sort({ created_at: -1 });

    // Filter by posted_user if provided
    if (posted_user && typeof posted_user === 'string') {
      query = query.where({ posted_user: posted_user });
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

export async function getResort(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await Resorts.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Resort not found",
        "getResort"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createResort(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    // Parse JSON strings from frontend
    const tagsData = req.body?.tags ? JSON.parse(req.body.tags) : [];
    const contentBoxesData = req.body?.overview?.map?.content_boxes ? JSON.parse(req.body.overview.map.content_boxes) : [];
    const infoBoxesData = req.body?.overview?.map?.info_boxes ? JSON.parse(req.body.overview.map.info_boxes) : [];
    const adventurePostsData = req.body?.overview?.adventure_posts ? JSON.parse(req.body.overview.adventure_posts) : [];

    const allFiles = req.files as Express.Multer.File[];

    //Main Image
    const resort_image = allFiles.find((f: any) => f.fieldname === "resort_image");
    if (resort_image) { req.body['image'] = `uploads\\\\resorts\\\\${resort_image.filename}`; }

    //Slider Images
    const slider_images = allFiles
      .filter((f: any) => f.fieldname.startsWith("overview_slider_images"))
      .map((f: any) => `uploads\\\\resorts\\\\${f.filename}`);

    if (req.body.overview) { req.body.overview['slider_images'] = slider_images.length > 0 ? slider_images : []; }

    //Banner Images
    if (req.body.overview_banners) {
      allFiles.filter((f: any) => {
        const match = f.fieldname.match(/overview_banners\[(\d+)\]\[image\]/);

        if (match) {
          const index = Number(match[1]);
          if (req.body.overview_banners[index]) {
            req.body.overview_banners[index].image =
              `uploads\\\\resorts\\\\${f.filename}`;
          }
        }
        return true;
      });
    }

    //Property Highlights Images
    if (req.body?.overview_property_highlights) {
      allFiles.filter((f: any) => {
        const match = f.fieldname.match(/overview_property_highlights\[(\d+)\]\[image\]/);

        if (match) {
          const index = Number(match[1]);
          if (req.body.overview_property_highlights[index]) {
            req.body.overview_property_highlights[index].image =
              `uploads\\\\resorts\\\\${f.filename}`;
          }
        }
        return true;
      });
    }

    // Build final resort payload
    const resortData: any = {
      name: req.body.name,
      location: req.body.location,
      country: req.body.country,
      short_description: req.body.short_description,
      tags: tagsData,
      posted_user: req.body.posted_user,
      image: req.body?.image,
      overview: {
        banners: req.body.overview_banners || [],
        about_title: req.body?.overview?.about_title,
        about_content: req.body?.overview?.about_content,
        about_button_text: req.body?.overview?.about_button_text,
        about_button_link: req.body?.overview?.about_button_link,
        property_highlights: req.body?.overview_property_highlights,
        slider_images: req.body?.overview?.slider_images || [],
        adventure_posts: adventurePostsData,
        map: {
          map_latitude: req.body?.overview?.map?.map_latitude || '',
          map_longitude: req.body?.overview?.map?.map_longitude || '',
          content_boxes: contentBoxesData,
          info_boxes: infoBoxesData,
        },
      },
      subscribe_title: req.body.subscribe_title,
      subscribe_sub_title: req.body.subscribe_sub_title,
      subscribe_button_text: req.body.subscribe_button_text,
      subscribe_button_link: req.body.subscribe_button_link,
      share_title: req.body.share_title,
      share_sub_title: req.body.share_sub_title,
      share_button_text: req.body.share_button_text,
      share_button_link: req.body.share_button_link,
      page_url: req.body.page_url,
      // SEO fields
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      robots: req.body.robots,
      author: req.body.author,
      publisher: req.body.publisher,
      copyright: req.body.copyright,
      revisit_after: req.body.revisit_after,
      classification: req.body.classification,
      rating: req.body.rating,
    };

    // Ensure unique slug
    let uniqueSlug = req.body.page_url;
    let counter = 1;

    while (await Resorts.findOne({ page_url: uniqueSlug })) {
      uniqueSlug = `${req.body.page_url}-${counter}`;
      counter++;
    }

    resortData.page_url = uniqueSlug;

    const resort = await Resorts.create(resortData);

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: resort });
  } catch (error) {
    console.error('Error creating resort:', error);
    next(error);
  }
}

export async function updateResort(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const body = req.body;
    let resortData: any = {};

    const allFiles = req.files as Express.Multer.File[];
    const oldresort = await Resorts.findOne({ _id });

    const handleImages = (tabIndex: string, oldfield: string, field: string, reqField: any) => {
      const oldImages = oldresort?.[tabIndex]?.[oldfield]?.map((b: any) => b.image) || [];
      
      allFiles.forEach((f: any) => {
        const match = f.fieldname.match(new RegExp(`${field}\\[(\\d+)\\]\\[image\\]`));
        if (match) {
          const index = Number(match[1]);
          if (reqField[index]) reqField[index].image = `uploads\\\\resorts\\\\${f.filename}`;
        }
      });

      const newImages = reqField?.map((b: any) => b.image).filter(Boolean) || [];
      const imagesToDelete = oldImages.filter((img: any) => !newImages.includes(img));
      imagesToDelete.forEach((img: any) => {
        if(img && path.join('public', img)){
          safeDeleteFile(path.join('public', img));
        }
      });
    };

    //OVRVIEW TAB
    if(req.body.overview){
      const tagsData = req.body?.tags ? JSON.parse(req.body.tags) : [];
      const contentBoxesData = req.body?.overview?.map?.content_boxes ? JSON.parse(req.body.overview.map.content_boxes) : [];
      const infoBoxesData = req.body?.overview?.map?.info_boxes ? JSON.parse(req.body.overview.map.info_boxes) : [];
      const adventurePostsData = req.body?.overview?.adventure_posts ? JSON.parse(req.body.overview.adventure_posts) : [];

      //Main Image
      const resort_image = allFiles.find((f: any) => f.fieldname === "resort_image");
      if (resort_image) { 
        req.body['image'] = `uploads\\\\resorts\\\\${resort_image.filename}`;
        if(req.body['image'] != oldresort.image){
          const oldFilePath = oldresort?.image
            ? path.join('public', oldresort?.image)
            : null;
          if (oldFilePath && fs.existsSync(oldFilePath)) {
            safeDeleteFile(oldFilePath);
          }
        }
      }

      const oldFilePath = oldresort?.rooms?.review_background 
            ? path.join('public', oldresort.rooms.review_background) 
            : null;

          if (oldFilePath && fs.existsSync(oldFilePath)) {
            safeDeleteFile(oldFilePath);
          }

      // Usage
      if (req.body?.overview_banners) handleImages('overview', 'banners', 'overview_banners', req.body.overview_banners);
      if (req.body?.overview_property_highlights) handleImages('overview', 'property_highlights', 'overview_property_highlights', req.body.overview_property_highlights);

      //Slider Images
      if (req.body?.overview_slider_images) {
        const oldImages = oldresort?.overview?.slider_images?.map((b: string) => b) || [];

        allFiles.filter((f: any) => {
          const match = f.fieldname.match(/overview_slider_images\[(\d+)\]/);

          if (match) {
            const index = Number(match[1]);
            req.body.overview_slider_images[index] = `uploads\\\\resorts\\\\${f.filename}`;
          }
          return true;
        });

        const newImages = req.body.overview_slider_images || [];
        const removedImages = oldImages.filter((img: string) => !newImages.includes(img));
        removedImages.forEach((img: string) => safeDeleteFile(path.join('public', img)));
      }


       resortData= {
        name: req.body.name,
        location: req.body.location,
        country: req.body.country,
        short_description: req.body.short_description,
        tags: tagsData,
        image: req.body?.image,
        overview: {
          banners: req.body.overview_banners || [],
          about_title: req.body?.overview?.about_title,
          about_content: req.body?.overview?.about_content,
          about_button_text: req.body?.overview?.about_button_text,
          about_button_link: req.body?.overview?.about_button_link,
          property_highlights: req.body?.overview_property_highlights,
          slider_images: req.body?.overview_slider_images || [],
          adventure_posts: adventurePostsData,
          map: {
            map_latitude: req.body?.overview?.map?.map_latitude || '',
            map_longitude: req.body?.overview?.map?.map_longitude || '',
            content_boxes: contentBoxesData,
            info_boxes: infoBoxesData,
          },
        },
        subscribe_title: req.body.subscribe_title,
        subscribe_sub_title: req.body.subscribe_sub_title,
        subscribe_button_text: req.body.subscribe_button_text,
        subscribe_button_link: req.body.subscribe_button_link,
        share_title: req.body.share_title,
        share_sub_title: req.body.share_sub_title,
        share_button_text: req.body.share_button_text,
        share_button_link: req.body.share_button_link,
        page_url: req.body.page_url,
        // SEO fields
        meta_title: req.body.meta_title,
        meta_description: req.body.meta_description,
        meta_keywords: req.body.meta_keywords,
        robots: req.body.robots,
        author: req.body.author,
        publisher: req.body.publisher,
        copyright: req.body.copyright,
        revisit_after: req.body.revisit_after,
        classification: req.body.classification,
        rating: req.body.rating,
      };

      let uniqueSlug = req.body.page_url;
      let counter = 1;
      while (
        await Resorts.findOne({
          page_url: uniqueSlug,
          _id: { $ne: _id }
        })
      ) {
        uniqueSlug = `${req.body.page_url}-${counter}`;
        counter++;
      }

      resortData.page_url = uniqueSlug;
    }

    //ROOMS TAB
    if(req.body.rooms_tab){
      if (req.body?.rooms_banners) handleImages('rooms', 'banners', 'rooms_banners', req.body.rooms_banners);

      const review_background = allFiles.find((f: any) => f.fieldname === "rooms_review_background");
      if (review_background) { 
        req.body['review_background'] = `uploads\\\\resorts\\\\${review_background.filename}`;
        if(req.body['review_background'] != oldresort?.rooms?.review_background){
          const oldFilePath = oldresort?.rooms?.review_background 
            ? path.join('public', oldresort.rooms.review_background) 
            : null;

          if (oldFilePath && fs.existsSync(oldFilePath)) {
            safeDeleteFile(oldFilePath);
          }
        }
      }

      //Gallery Images
      if (req.body?.rooms_room_lists) {
        allFiles.filter((f: any) => {
          const match_g = f.fieldname.match(/rooms_room_lists\[(\d+)\]\[gallery\]\[(\d+)\]/);

          if (match_g) {
            const sectionIndex = match_g[1];
            const innerIndex = match_g[2];

            if (!req.body.rooms_room_lists[sectionIndex]) {
              req.body.rooms_room_lists[sectionIndex] = {};
            }

            if (!req.body.rooms_room_lists[sectionIndex].gallery) {
              req.body.rooms_room_lists[sectionIndex].gallery = [];
            }

            req.body.rooms_room_lists[sectionIndex].gallery[innerIndex] = `uploads\\\\resorts\\\\${f.filename}`;
          }

          return true;
        });
      }

      resortData= {
        rooms: {
          banners: req.body.rooms_banners || [],
          about_button_text: req.body?.rooms?.about_button_text,
          about_button_link: req.body?.rooms?.about_button_link,
          review_background: req.body?.review_background,
          selected_review: req.body?.rooms?.selected_review,
          room_lists: req.body?.rooms_room_lists || [],
        },
      };
    }

    //SERVICES & AMENTIES TAB
    if(req.body.services_amenities_tab){
      if (req.body?.services_amenities_banners) handleImages('services_amenities', 'banners', 'services_amenities_banners', req.body.services_amenities_banners);
      if (req.body?.services_amenities_sections) handleImages('services_amenities', 'services_sections', 'services_amenities_sections', req.body.services_amenities_sections);

      resortData= {
        services_amenities: {
          banners: req.body?.services_amenities_banners || [],
          about_title: req.body?.services_amenities?.about_title,
          about_button_text: req.body?.services_amenities?.about_button_text,
          about_button_link: req.body?.services_amenities?.about_button_link,
          services_sections: req.body?.services_amenities_sections
        },
      };
    }

    //OFFERS TAB
    if(req.body.offers_tab){
      if (req.body?.offers_banners) handleImages('offers', 'banners', 'offers_banners', req.body.offers_banners);
      if (req.body?.offers_offers_lists) handleImages('offers', 'offers_lists', 'offers_offers_lists', req.body.offers_offers_lists);

      const bottom_image = allFiles.find((f: any) => f.fieldname === "offers_bottom_image");
      if (bottom_image) { 
        req.body['bottom_image'] = `uploads\\\\resorts\\\\${bottom_image.filename}`;
        if(req.body['bottom_image'] != oldresort?.offers?.bottom_image){
          const oldFilePath = oldresort?.offers?.bottom_image 
            ? path.join('public', oldresort.offers.bottom_image) 
            : null;

          if (oldFilePath && fs.existsSync(oldFilePath)) {
            safeDeleteFile(oldFilePath);
          }
        }
      }

      resortData= {
        offers: {
          banners: req.body?.offers_banners || [],
          about_button_text: req.body?.offers?.about_button_text,
          about_button_link: req.body?.offers?.about_button_link,
          offers_lists: req.body?.offers_offers_lists,
          bottom_image: req.body?.bottom_image,
        },
      };
    }

    if(req.body.stories_tab){
      if (req.body?.stories_banners) handleImages('stories', 'banners', 'stories_banners', req.body.stories_banners);

      if (req.body?.story_sections) {
        const oldImages = oldresort?.overview?.story_sections?.map((b: any) => b.userprofile) || [];

        allFiles.filter((f: any) => {
          const match = f.fieldname.match(/story_sections\[(\d+)\]\[userprofile\]/);

          if (match) {
            const index = Number(match[1]);

            if (!req.body.story_sections[index]) {
              req.body.story_sections[index] = {};
            }

            req.body.story_sections[index].userprofile = `uploads\\\\resorts\\\\${f.filename}`;
          }
          return true;
        });

        const newImages = req.body.overview_slider_images || [];
        const removedImages = oldImages.filter((img: string) => !newImages.includes(img));
        removedImages.forEach((img: string) => safeDeleteFile(path.join('public', img)));
      }

      //Story Gallery Images
      if (req.body?.story_sections) {
        allFiles.filter((f: any) => {
          const match_g = f.fieldname.match(/story_sections\[(\d+)\]\[gallery\]\[(\d+)\]/);

          if (match_g) {
            const sectionIndex = match_g[1];
            const innerIndex = match_g[2];

            if (!req.body.story_sections[sectionIndex]) {
              req.body.story_sections[sectionIndex] = {};
            }

            if (!req.body.story_sections[sectionIndex].gallery) {
              req.body.story_sections[sectionIndex].gallery = [];
            }

            req.body.story_sections[sectionIndex].gallery[innerIndex] = `uploads\\\\resorts\\\\${f.filename}`;
          }

          return true;
        });
      }

      resortData= {
        stories: {
          banners: req.body.stories_banners || [],
          about_title: req.body?.stories?.about_title,
          stories_lists: req.body?.story_sections || [],
        },
      };
    }

    const resort = await Resorts.findByIdAndUpdate(
      _id,
      { $set: { ...resortData } },
      { new: true }
    );

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: resort });
  } catch (error) {
    console.error('Error creating resort:', error);
    next(error);
  }
}

export async function deleteResorts (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const banner = await Resorts.findOne({
      _id: _id,
    });

    if (!banner)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Resort with this id not found",
        "deleteResorts"
      );

    const _del = await Resorts.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, banner });
  } catch (error) {
    next(error)
  }
}

export async function getResortBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pgeSlug = req.params.slug;
    const data = await Resorts.findOne({
      page_url: pgeSlug,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Resort not found",
        "getResortBySlug"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function getAllUniqueTags(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await Resorts.aggregate([
      {
        $match: {
          tags: { 
            $exists: true, 
            $ne: [] 
          }
        }
      },
      {
        $unwind: "$tags"
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          tag: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    const uniqueTags = result.map(item => item.tag);

    return res.status(config.statusCode.SUCCESS).json({ success: true, count: uniqueTags.length, data: uniqueTags });
  } catch (error) {
    next(error);
  }
};

export async function getResortsByTag(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tags = req.body?.tags || req.body?.tag;
    
    if (!tags)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Tag(s) not found in request body",
        "getResortsByTag"
      );

    let tagsArray: string[];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    } else {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        "Tags must be a string or array",
        "getResortsByTag"
      );
    }

    tagsArray = tagsArray.filter(tag => tag.length > 0);
    
    if (tagsArray.length === 0) {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        "No valid tags provided",
        "getResortsByTag"
      );
    }

    const fields = req.body?.fields as string;
    let selectFields = '';
    
    if (fields) {
      selectFields = fields.split(',').map(field => field.trim()).join(' ');
    } else {
      selectFields = 'id name location tags short_description page_url image';
    }

    const tagPatterns = tagsArray.map(tag => new RegExp(`^${tag}$`, 'i'));

    const resorts = await Resorts.find({
      tags: { 
        $exists: true,
        $ne: null,
        $in: tagPatterns
      }
    }).select(selectFields);

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      count: resorts.length,
      data: resorts,
      requestedTags: tagsArray,
      matchedTagsCount: tagsArray.length
    });
  } catch (error) {
    next(error);
  }
};