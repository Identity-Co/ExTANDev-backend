import { IRoyaltyParameters, IActionList, IPointsHistory } from "../interfaces/royalty";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const RoyaltyParameters = mongoose.model("RoyaltyParameters");
const ActionList = mongoose.model("ActionList");
const PointsHistory = mongoose.model("PointsHistory");

export async function getRoyaltyParameters(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let royalty_parameters:any = [];
    royalty_parameters = await RoyaltyParameters.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: royalty_parameters });

  } catch (error) {
    next(error);
  }
}

export async function getActionList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let action_list:any = [];
    action_list = await ActionList.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: action_list });

  } catch (error) {
    next(error);
  }
}

export async function getActionByCode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let action_list:any = [];
    action_list = await ActionList.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: action_list });

  } catch (error) {
    next(error);
  }
}

export async function getPointsByCode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const code = req.params.code;
  console.log('Code received: ', code)

  try {
    const parameter = await RoyaltyParameters.findOne(
      {parameter_key: code},
      { parameter_value: 1 }
    );

    console.log('Get parameter: ', parameter)

    if (!parameter) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: false, value: 0 })
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, value: parameter.parameter_value });

  } catch (error) {
    next(error);
  }
}

export async function getPointsHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.query;

  try {
    let points_history:any = [];

    points_history = await PointsHistory.find({
      "member_id": user_id
    }).sort({ created_at: -1 });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: points_history });

  } catch (error) {
    next(error);
  }
}

export async function savePointsHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const p_history = await PointsHistory.create({
      ...body,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ 
        success: true, 
        data: p_history,
      });

  } catch (error) {
    next(error);
  }
}

export async function checkPointsHistoryExist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const existingHistory = await PointsHistory.findOne({
      member_id: body.member_id,
      action_id: body.action_id,
      action_sub_type: body.action_sub_type ?? '',
      reference_id: body.reference_id,
    });

    if (existingHistory) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ 
          success: true, 
          exists: 1,
        });
    } else {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ 
          success: true, 
          exists: 0,
        });
    }

  } catch (error) {
    next(error);
  }
}

export async function removePointsHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    /* const existingHistory = await PointsHistory.findOne({
      member_id: body.member_id,
      action_id: body.action_id,
      action_sub_type: body.action_sub_type ?? '',
      reference_id: body.reference_id,
    });

    if (existingHistory) {
      await PointsHistory.deleteOne({
        _id: existingHistory._id
        member_id: body.member_id,
        action_id: body.action_id,
        action_sub_type: body.action_sub_type ?? '',
        reference_id: body.reference_id
      });
    } */

    await PointsHistory.deleteMany({
      member_id: body.member_id,
      action_id: body.action_id,
      action_sub_type: body.action_sub_type ?? '',
      reference_id: body.reference_id
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


export async function updateRoyaltyParameters (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const key = req.params.key;
    let body = req.body;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const royalty_para = await RoyaltyParameters.findOne({
      parameter_key: key,
    });

    if (!royalty_para)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Royalty Settings not exist",
        "updateRoyaltyParameters"
      );

    console.log('royalty_para: ', royalty_para)

    const _royalty_para = await RoyaltyParameters.findByIdAndUpdate(
        royalty_para._id,
        { ...body },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: royalty_para });
  } catch (error) {
    next(error)
  }
}

//////////

export async function getTotalEarned(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.query;

  try {
    const result = await PointsHistory.aggregate([
      {
        $match: {
          member_id: user_id,
          action_id: { $ne: 'REDEEM_POINTS' }
        }
      },
      {
        $group: {
          _id: null,
          total_points: { $sum: '$points_earned' }
        }
      }
    ]);

    const total_points = result.length > 0 ? result[0].total_points : 0;

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, total_points: total_points });

  } catch (error) {
    next(error);
  }
}

export async function getTotalRedeemed(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.query;

  try {
    const result = await PointsHistory.aggregate([
      {
        $match: {
          member_id: user_id,
          action_id: 'REDEEM_POINTS'
        }
      },
      {
        $group: {
          _id: null,
          total_redeemed: { $sum: '$points_earned' }
        }
      }
    ]);

    const total_redeemed = result.length > 0 ? result[0].total_redeemed : 0;

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      total_redeemed
    });

  } catch (error) {
    next(error);
  }
}

export async function getCurrentBalance(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.query;

  try {
    // Step 1: Calculate total earned (excluding REDEEM_POINTS)
    const earnedResult = await PointsHistory.aggregate([
      {
        $match: {
          member_id: user_id,
          action_id: { $ne: 'REDEEM_POINTS' }
        }
      },
      {
        $group: {
          _id: null,
          total_earned: { $sum: '$points_earned' }
        }
      }
    ]);

    const total_earned = earnedResult.length > 0 ? earnedResult[0].total_earned : 0;

    // Step 2: Calculate total redeemed (only REDEEM_POINTS)
    const redeemedResult = await PointsHistory.aggregate([
      {
        $match: {
          member_id: user_id,
          action_id: 'REDEEM_POINTS'
        }
      },
      {
        $group: {
          _id: null,
          total_redeemed: { $sum: '$points_earned' }
        }
      }
    ]);

    const total_redeemed = redeemedResult.length > 0 ? redeemedResult[0].total_redeemed : 0;

    // Step 3: Compute current balance
    const current_balance = total_earned - total_redeemed;

    // Step 4: Return response
    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      total_earned,
      total_redeemed,
      current_balance
    });

  } catch (error) {
    next(error);
  }
}
