import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const Likes = mongoose.model("Likes");
const Tours = mongoose.model("Tours");
const Reviews = mongoose.model("Reviews");
const Destination = mongoose.model("Destination");
const Resorts = mongoose.model("Resorts");
const AGuide = mongoose.model("AdventureGuide");

// public route
export async function allLikes(
  req: Request,
  res: Response,
  next: NextFunction
) {
	try {
		const likes = await Likes.find();

		return res
	      .status(config.statusCode.SUCCESS)
	      .json({ success: true, data: likes });

	} catch (error) {
    	next(error);
  	}
}

// user authenticate route
export async function addLike(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingLike = await Likes.findOne({
      user_id: body.user_id,
      collection_name: body.collection_name,
      collection_id: body.collection_id,
    });

    if (existingLike) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ 
          success: true, 
          data: existingLike,
        });
    }

    const like = await Likes.create({
      ...body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: like,
      });

  } catch (error) {
    next(error);
  }
}

export async function removeLike(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingLike = await Likes.findOne({
      user_id: body.user_id,
      collection_name: body.collection_name,
      collection_id: body.collection_id,
    });

    if (!existingLike) {
      return res
        .status(config.statusCode.NOTFOUND)
        .json({ 
          success: false, 
        });
    }

    await Likes.deleteOne({
      _id: existingLike._id
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

export async function getLikesCountAndStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const collection_name = req?.body?.collection_name ?? null;
  const collection_id = req?.body?.collection_id ?? null;
  const user_id = req?.body?.user_id ?? null;

  try {
    const totalLikes = await Likes.countDocuments({
      collection_name,
      collection_id
    });

    let hasLiked = false;
    if (user_id) {
      const userLike = await Likes.findOne({
        user_id,
        collection_name,
        collection_id
      });
      hasLiked = !!userLike;
    }

    // Send response back to client
    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      hasLiked,
      totalLikes
    });
    
  } catch (error) {
    console.error('Error in getLikesCountAndStatus:', error);
    
    return res.json({
      success: false,
      message: error,
      hasLiked : false,
      totalLikes: 0
    });
  }
}

export async function getUserLikes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let validLikedPosts: any = [];

    const userId = req?.body?.user_id;
    
    const isLike = await Likes.find({ user_id: userId })
      .sort({ createdAt: -1 });

    if (isLike) {
      const likedPosts = await Promise.all(
        isLike.map(async (_like: any) => {
          let postDetails = null;
          
          switch (_like.collection_name) {
            case 'adventure_post':
              postDetails = await Tours.findById(_like.collection_id)
                .select('name image slug');
              break;

            case 'adventure_guide':
              postDetails  = await AGuide.findById(_like.collection_id)
                .select('title feature_image page_url');
              break;

            case 'destination_story':
              const destination = await Destination.findOne({
                'stories.stories._id': _like.collection_id
              })
              .select('_id title page_url stories');
              
              if (destination && destination.stories.stories) {
                const story = destination.stories.stories.find(
                  (s: any) => s._id.toString() === _like.collection_id.toString()
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
                'stories.stories_lists._id': _like.collection_id
              })
              .select('_id title page_url stories');
              
              if (resort && resort.stories.stories_lists) {
                const story = resort.stories.stories_lists.find(
                  (s: any) => s._id.toString() === _like.collection_id.toString()
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
              postDetails = await Reviews.findById(_like.collection_id)
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
            _id: _like._id,
            postType: _like.collection_name,
            likedAt: _like.createdAt,
            post: postDetails
          };
        })
      );

      validLikedPosts = likedPosts.filter((item: any) => item.post !== null);
    }

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: validLikedPosts,
      count: validLikedPosts.length
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Error fetching liked posts',
      error: error
    });
  }
}