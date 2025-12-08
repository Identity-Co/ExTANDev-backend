import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const Saved = mongoose.model("Saved");
const Tours = mongoose.model("Tours");
const Reviews = mongoose.model("Reviews");
const Destination = mongoose.model("Destination");
const Resorts = mongoose.model("Resorts");
const AGuide = mongoose.model("AdventureGuide");

// user authenticate route
export async function addSaved(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingSaved = await Saved.findOne({
      user_id: body.user_id,
      collection_name: body.collection_name,
      collection_id: body.collection_id,
    });

    if (existingSaved) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ 
          success: true, 
          data: existingSaved,
        });
    }

    const save = await Saved.create({
      ...body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: save,
      });

  } catch (error) {
    next(error);
  }
}

export async function removeShaved(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingSaved = await Saved.findOne({
      user_id: body.user_id,
      collection_name: body.collection_name,
      collection_id: body.collection_id,
    });

    if (!existingSaved) {
      return res
        .status(config.statusCode.NOTFOUND)
        .json({ 
          success: false, 
        });
    }

    await Saved.deleteOne({
      _id: existingSaved._id
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: null,
      });

  } catch (error) {
    next(error);
  }
}

export async function getSavedStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const collection_name = req?.body?.collection_name ?? null;
  const collection_id = req?.body?.collection_id ?? null;
  const user_id = req?.body?.user_id ?? null;

  try {

    let hasSaved = false;
    if (user_id) {
      const userSave = await Saved.findOne({
        user_id,
        collection_name,
        collection_id
      });
      hasSaved = !!userSave;
    }

    // Send response back to client
    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      hasSaved,
    });
    
  } catch (error) {
    console.error('Error in getSavedStatus:', error);
    
    return res.json({
      success: false,
      message: error,
      hasSaved : false,
    });
  }
}

export async function getUserSaved(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let validSavedPosts: any = [];

    const userId = req?.body?.user_id;
    
    const isSave = await Saved.find({ user_id: userId })
      .sort({ createdAt: -1 });

    if (isSave) {
      const savedPosts = await Promise.all(
        isSave.map(async (_save: any) => {
          let postDetails = null;
          
          switch (_save.collection_name) {
            case 'adventure_post':
              postDetails = await Tours.findById(_save.collection_id)
                .select('name image slug');
              break;

            case 'adventure_guide':
              postDetails  = await AGuide.findById(_save.collection_id)
                .select('title feature_image page_url');
              break;

            case 'destination_story':
              const destination = await Destination.findOne({
                'stories.stories._id': _save.collection_id
              })
              .select('_id title page_url stories');
              
              if (destination && destination.stories.stories) {
                const story = destination.stories.stories.find(
                  (s: any) => s._id.toString() === _save.collection_id.toString()
                );
                
                if (story) {
                  postDetails = {
                    _id: destination._id,
                    slug: destination.page_url,
                    title: destination.title,
                    name: story.name,
                    userprofile: story.userprofile,
                    username: story.username,
                    story_id: story._id
                  };
                }
              }
              break;

            case 'resort_story':
              const resort = await Resorts.findOne({
                'stories.stories_lists._id': _save.collection_id
              })
              .select('_id title page_url stories');
              
              if (resort && resort.stories.stories_lists) {
                const story = resort.stories.stories_lists.find(
                  (s: any) => s._id.toString() === _save.collection_id.toString()
                );
                
                if (story) {
                  postDetails = {
                    _id: resort._id,
                    slug: resort.page_url,
                    title: resort.name,
                    name: story.name,
                    userprofile: story.userprofile,
                    username: story.username,
                    story_id: story._id
                  };
                }
              }
              break;

            case 'reviews':
              postDetails = await Reviews.findById(_save.collection_id)
                .select('review_text rating')
                .populate({
                  path: 'user_id',
                  select: 'first_name last_name profile_picture',
                  model: 'User'
                });
              break;

            default:
              break;
          }

          return {
            _id: _save._id,
            postType: _save.collection_name,
            SavedAt: _save.createdAt,
            post: postDetails
          };
        })
      );

      validSavedPosts = savedPosts.filter((item: any) => item.post !== null);
    }

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: validSavedPosts,
      count: validSavedPosts.length
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Error fetching saved posts',
      error: error
    });
  }
}