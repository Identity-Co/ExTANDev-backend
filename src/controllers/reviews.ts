import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import TwilioService from "../services/twilio";
import SendGridEmailService from "../services/sendgrid.mail";

import util from "util";

const Reviews = mongoose.model("Reviews");
const User = mongoose.model("User");

const adminEmailTemplate = `<table width="100%" id="outer_wrapper" style="background-color: #F0F0F0;" bgcolor="#F0F0F0">
  <tr>
    <td><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
    <td width="600" style="padding:70px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_container" style="background-color: #fff; border-radius: 0px;" bgcolor="#fff">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_header" style="background-color: #014040; color: #fff; border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; border-radius: 0px;" bgcolor="#fff">
              <tbody>
                <tr>
                  <td id="header_wrapper" align="center" style="padding: 20px 0; display: block;">
                    <img src="images/head-logo.png" width="200" alt="" border="0"> 
                  </td>
                </tr>
              </tbody>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tbody>
                <tr>
                  <td valign="top" style="padding:48px 48px 48px 48px; color: #1F1F1F; font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; font-size: 13px; line-height: 150%; text-align: left;"><div id="body_content_inner" style="color: #1F1F1F; font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; font-size: 13px; line-height: 150%; text-align: left;" align="left">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td>
                                <p style="font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; font-size: 13px; line-height: 150%; margin:0 0 5px;">Hi Admin,</p>
                                <p style="font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; font-size: 13px; line-height: 150%; margin:0 0 15px;">Here are the new review submission details.:</p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding: 0 0px;">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                                  <tr>
                                      <td style="padding: 0 0 20px;">
                                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                              <tr>
                                                  <td width="30%" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">First Name:<br>{{first_name}}</td>
                                                  <td width="70%" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{first_name}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Last Name:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{last_name}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Email:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{email}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Rating:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{rating}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Review Text:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{review_text}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Page URL:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{page_url}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">IP Address:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{ip_address}}</td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                              </table>
                            </td>
                        </tr>
                      </table>
                    </div></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
        <tr>
            <td colspan="4" bgcolor="#014040" height="5" width="620" style="border-bottom:5px solid #014040;"></td>
        </tr>
      </table>
    </td>
    <td><!-- Deliberately empty to support consistent sizing and layout across multiple email clients. --></td>
  </tr>
</table>`;

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields } = req.query;
    
    let formData: any = [];
    
    let pipeline: any[] = [
      {
        $addFields: {
          convertedUserId: { $toObjectId: "$user_id" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId', // Use the converted field
          foreignField: '_id',
          as: 'user_data'
        }
      },
      {
        $unwind: {
          path: '$user_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          user_first_name: '$user_data.first_name',
          user_last_name: '$user_data.last_name',
          user_email: '$user_data.email',
          user_profile_picture: '$user_data.profile_picture'
        }
      },
      {
        $project: {
          user_data: 0,
          convertedUserId: 0 // Remove the temporary conversion field
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ];

    // Handle field selection
    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      
      const projectStage: any = {};
      fieldArray.forEach(field => {
        projectStage[field] = 1;
      });
      
      // Always include _id unless explicitly excluded
      if (!fieldArray.includes('_id') && !fieldArray.includes('-_id')) {
        projectStage._id = 1;
      }
      
      pipeline.push({ $project: projectStage });
    }
    
    formData = await Reviews.aggregate(pipeline);
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}

export async function getEntry(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    
    const formData = await Reviews.aggregate([
      {
        $match: {
          _id: _id
        }
      },
      {
        $addFields: {
          "user_id_object": { $toObjectId: "$user_id" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id_object",
          foreignField: "_id",
          as: "user_info"
        }
      },
      {
        $unwind: {
          path: "$user_info",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          "review_text": 1,
          "rating": 1,
          "status": 1,
          "ip_address": 1,
          "review_url": 1,
          "created_at": 1,
          "user_info.first_name": 1,
          "user_info.last_name": 1,
          "user_info.email": 1,
          "user_info.profile_picture": 1,
          "user_id": 1
        }
      }
    ]);

    if (!formData || formData.length === 0)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Review not found",
        "getEntry"
      );

    return res.status(config.statusCode.SUCCESS).json({ 
      success: true, 
      data: formData[0]
    });
  } catch (error) {
    next(error)
  }
}

export async function createEntry(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const formData = await Reviews.create({
      ...req.body,
    });

    const emailServiceObj = new SendGridEmailService(
      config.ADMIN_CONSTANTS.SENDGRID_FROM_EMAIL,
      config.ADMIN_CONSTANTS.SENDGRID_API_KEY
    );

    let userFirstName: string = '';
    let userLastName: string = '';
    let userEmail: string = '';

    if (req.body.user_id) {
      const _user = await User.findById(req.body.user_id).select('first_name last_name email');

      if (_user) {
        userFirstName = _user.first_name || '';
        userLastName = _user.last_name || '';
        userEmail = _user.email || '';
      }
    }

    const emailHtml = adminEmailTemplate
      .replace('{{first_name}}', userFirstName?? '')
      .replace('{{last_name}}', userLastName?? '')
      .replace('{{email}}', userEmail?? '')
      .replace('{{rating}}', req.body.rating?? '')
      .replace('{{review_text}}', req.body.review_text?? '')
      .replace('{{page_url}}', req.body.review_url?? '')
      .replace('{{ip_address}}', req.body.ip_address?? '')

    const sendEmailRespone = await emailServiceObj.sendEmail({
      to: ['admin@advnetwork.com'],
      subject: 'New Review Submission Received',
      html: emailHtml,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(
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

    const review = await Reviews.findOne({
      _id: _id,
    });

    if (!review){
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Review not exist",
        "updateStatus"
      );
    }

    const _review = await Reviews.findByIdAndUpdate(
      _id,
      { 
        $set: { 
          status: body.status?? 0,
          updated_at: new Date()
        } 
      },
      { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _review });
  } catch (error) {
    next(error)
  }
}

export async function deleteEntry (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const entry = await Reviews.findOne({
      _id: _id,
    });

    if (!entry)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Review with this id not found",
        "deleteEntry"
      );

    const _del = await Reviews.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, entry });
  } catch (error) {
    next(error)
  }
}

export async function getReviews(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { 
      fields, 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      search,
      rating,
      user_id
    } = req.body;
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Cap at 100 for safety
    const skip = (pageNum - 1) * limitNum;
    
    let pipeline: any[] = [
      {
        $match: {
          status: 1
        }
      },
      {
        $addFields: {
          convertedUserId: { $toObjectId: "$user_id" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'user_data'
        }
      },
      {
        $unwind: {
          path: '$user_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          user_first_name: '$user_data.first_name',
          user_last_name: '$user_data.last_name',
          user_email: '$user_data.email',
          user_profile_picture: '$user_data.profile_picture'
        }
      },
      {
        $project: {
          user_data: 0,
          convertedUserId: 0
        }
      }
    ];

    // Add search filter if provided
    if (search && typeof search === 'string') {
      pipeline.unshift({
        $match: {
          $or: [
            { comment: { $regex: search, $options: 'i' } },
            { 'user_data.first_name': { $regex: search, $options: 'i' } },
            { 'user_data.last_name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add rating filter if provided
    if (rating) {
      const ratingNum = parseInt(rating);
      if (!isNaN(ratingNum)) {
        pipeline.unshift({
          $match: { rating: ratingNum }
        });
      }
    }

    // Add user_id filter if provided
    if (user_id && typeof user_id === 'string') {
      pipeline.unshift({
        $match: { user_id: user_id }
      });
    }

    // Handle sorting
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { [sortBy as string]: sortDirection }
    });

    // Get total count for pagination info
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await Reviews.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limitNum }
    );

    // Handle field selection
    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      
      const projectStage: any = {};
      fieldArray.forEach(field => {
        projectStage[field] = 1;
      });
      
      // Always include _id unless explicitly excluded
      if (!fieldArray.includes('_id') && !fieldArray.includes('-_id')) {
        projectStage._id = 1;
      }
      
      pipeline.push({ $project: projectStage });
    }
    
    const reviews = await Reviews.aggregate(pipeline);
    
    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
}


export async function getReviewsByCollectionId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { collection_id, fields } = req.body;
    
    // Validate collection_id
    if (!collection_id) {
      return res.status(config.statusCode.BAD_REQUEST).json({
        success: false,
        message: "Collection ID is required"
      });
    }

    let formData: any = [];
    
    let pipeline: any[] = [
      // Match reviews by collection_id
      {
        $match: {
          collection_id: collection_id,
          status: 1
        }
      },
      {
        $addFields: {
          convertedUserId: { $toObjectId: "$user_id" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'user_data'
        }
      },
      {
        $unwind: {
          path: '$user_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          user_first_name: '$user_data.first_name',
          user_last_name: '$user_data.last_name',
          user_email: '$user_data.email',
          user_profile_picture: '$user_data.profile_picture'
        }
      },
      {
        $project: {
          user_data: 0,
          convertedUserId: 0
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ];

    // Handle field selection
    if (fields) {
      const fieldArray = typeof fields === 'string' ? fields.split(',').map(field => field.trim()) : fields;
      
      const projectStage: any = {};
      fieldArray.forEach((field: string) => {
        projectStage[field] = 1;
      });
      
      // Always include _id unless explicitly excluded
      if (!fieldArray.includes('_id') && !fieldArray.includes('-_id')) {
        projectStage._id = 1;
      }
      
      pipeline.push({ $project: projectStage });
    }
    
    formData = await Reviews.aggregate(pipeline);
    
    // Check if reviews were found
    if (!formData || formData.length === 0) {
      return res.json({
        success: false,
        message: "No reviews found for this collection",
        data: []
      });
    }
    
    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: formData,
      count: formData.length
    });
  } catch (error) {
    next(error);
  }
}