import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const Follows = mongoose.model("Follows");

export async function addFollow(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingFollow = await Follows.findOne({
      user_id: new Types.ObjectId(body.user_id),
      follow_type: body.follow_type,
      follow_id: new Types.ObjectId(body.follow_id),
    });

    if (existingFollow) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ 
          success: true, 
          data: existingFollow,
        });
    }

    const follow = await Follows.create({
      ...body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: follow,
      });

  } catch (error) {
    next(error);
  }
}

export async function removeFollow(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingFollow = await Follows.findOne({
      user_id: new Types.ObjectId(body.user_id),
      follow_type: body.follow_type,
      follow_id: new Types.ObjectId(body.follow_id),
    });

    if (!existingFollow) {
      return res
        .status(config.statusCode.NOTFOUND)
        .json({ 
          success: false, 
        });
    }

    await Follows.deleteOne({
      _id: existingFollow._id
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: true,
      });

  } catch (error) {
    next(error);
  }
}

export async function getFollowStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const follow_type = req?.body?.follow_type ?? null;
  const follow_id = req?.body?.follow_id ?? null;
  const user_id = req?.body?.user_id ?? null;

  try {

    let hasFollowed = false;
    if (user_id) {
      const userFollow = await Follows.findOne({
        user_id: new Types.ObjectId(user_id),
        follow_type,
        follow_id: new Types.ObjectId(follow_id)
      });
      hasFollowed = !!userFollow;
    }

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      hasFollowed,
    });
    
  } catch (error) {
    console.error('Error in getFollowStatus:', error);
    
    return res.json({
      success: false,
      message: error,
      hasFollowed : false,
    });
  }
}