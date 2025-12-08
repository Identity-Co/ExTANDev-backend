import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const Tours = mongoose.model("Tours");
const Destination = mongoose.model("Destination");

export async function getCollectionData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let result = null;

    const collection_type = req.body.collection_type
    const collection_id = new Types.ObjectId(req.body.collection_id);

    switch (collection_type) {
      case 'adventure_post':

        const tour = await Tours.findOne({ 
          _id: collection_id
        }).select('name slug image description');
        
        if (tour) {
          result = {
            name: tour.name,
            slug: tour.slug,
            image: tour.image,
            description: tour.description
          };
        }
        break;

      case 'destination_story':
        const destination = await Destination.findOne({
          'stories.stories._id': collection_id
        })
        .select('_id title image page_url meta_description')
        .lean() as any;

        if (destination) {
          result = {
            title: destination.title,
            image: destination.image,
            page_url: destination.page_url,
            meta_description: destination.meta_description
          };
        }
        break;

      default:
        return res.json({
          success: false, 
          message: 'Invalid collection type',
        })
    }

    return res.status(config.statusCode.SUCCESS).json({
      success: true, 
      data: result 
    })

  } catch (error) {
    console.error('Error fetching collection data:', error);
    return res.json({
      success: false, 
      message: 'Internal server error',
      error: error
    })
  }
}