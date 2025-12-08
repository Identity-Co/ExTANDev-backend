import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

import fs from 'fs';
import path from 'path';

const Comments = mongoose.model("Comments");
const Tours = mongoose.model("Tours");
const Reviews = mongoose.model("Reviews");
const Destination = mongoose.model("Destination");
const Resorts = mongoose.model("Resorts");
const AGuide = mongoose.model("AdventureGuide");


function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
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

// user authenticate route
export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const uploadDir = path.join('public', 'uploads', 'comments');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let images: string[] = [];
    if(body.images){
      body.images.forEach((fileObj: Record<string, string>) => {
        for (const [fileName, file] of Object.entries(fileObj)) {
          if (file && typeof file === "string" && isBase64Image(file)) {
            const matches = file.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
              throw new Error("Invalid base64 image format");
            }
            const base64Data = matches[2];

            const fName = fileName.substring(0, fileName.lastIndexOf('-'));
            const buffer = Buffer.from(base64Data, "base64");
            const uniqueName = `${Date.now()}-${fName}`;
            const savePath = path.join('public', 'uploads', 'comments', uniqueName)

            fs.writeFileSync(savePath, buffer);
            images.push(`uploads\\comments\\${uniqueName}`);
          }
        }
      });
    }

    if(images){
      body.images = images;
    }

    const like = await Comments.create({
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

export async function deleteComment (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const comment = await Comments.findOne({
      _id: _id,
    });

    if (!comment)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Comment with this id not found",
        "deleteComment"
      );

    const _del = await Comments.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, comment });
  } catch (error) {
    next(error)
  }
}

export async function getComments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;

    const comment_ = await Comments.aggregate([
      {
        $match: {
          parent_id: null,
          collection_name: body?.collection_name,
          collection_id: body?.collection_id,
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_info'
        }
      },
      {
        $unwind: {
          path: '$user_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { mainCommentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { 
                      $eq: [
                        '$parent_id', 
                        { $toString: '$$mainCommentId' } // Convert ObjectId to string for comparison
                      ] 
                    },
                    { $eq: ['$collection_name', body?.collection_name] },
                    { $eq: ['$collection_id', body?.collection_id] }
                  ]
                }
              }
            },
            // Populate user data for sub-comments
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user_info'
              }
            },
            {
              $unwind: {
                path: '$user_info',
                preserveNullAndEmptyArrays: true
              }
            },
            // Select and format fields for sub-comments
            {
              $project: {
                _id: 1,
                comment: 1,
                created_at: 1,
                updated_at: 1,
                parent_id: 1,
                upvoteCount: 1,
                upvotes: 1,
                helpfules: 1,
                helpfulCount: 1,
                reports: 1,
                images: 1,
                user_id: 1,
                user: {
                  first_name: '$user_info.first_name',
                  last_name: '$user_info.last_name',
                  profile_picture: '$user_info.profile_picture'
                },
              }
            },
            // Sort sub-comments by date ASC (oldest first)
            {
              $sort: { created_at: 1 }
            }
          ],
          as: 'replies'
        }
      },
      {
        $project: {
          _id: 1,
          comment: 1,
          created_at: 1,
          updated_at: 1,
          parent_id: 1,
          upvoteCount: 1,
          upvotes: 1,
          helpfules: 1,
          helpfulCount: 1,
          reports: 1,
          images: 1,
          user_id: 1,
          user: {
            first_name: '$user_info.first_name',
            last_name: '$user_info.last_name',
            profile_picture: '$user_info.profile_picture'
          },
          replies: 1
        }
      }
    ]);

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      count: comment_.length,
      data: comment_
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Server error while fetching comments',
      error: error
    });
  }
}


export async function upvoteComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { comment_id, user_id, action } = req.body;

    if (!comment_id || !user_id || !action) {
      return res.json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(comment_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const comment = await Comments.findById(comment_id);
    if (!comment) {
      return res.json({
        success: false,
        message: 'Comment not found'
      });
    }

    const hasUpvoted = comment.upvotes.some((upvoteId: mongoose.Types.ObjectId) => 
      upvoteId.toString() === user_id.toString()
    );

    const shouldAddUpvote = (action === 'add' && !hasUpvoted) || false;
    
    let updateOperation;
    let finalAction;

    if (shouldAddUpvote) {
      updateOperation = {
        $addToSet: { upvotes: user_id },
        $inc: { upvoteCount: 1 },
        $set: { updatedAt: new Date() }
      };
      finalAction = 'added';
    } else {
      updateOperation = {
        $pull: { upvotes: user_id },
        $inc: { upvoteCount: -1 },
        $set: { updatedAt: new Date() }
      };
      finalAction = 'removed';
    }

    const result = await Comments.findByIdAndUpdate(
      comment_id,
      updateOperation,
      { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      message: `Upvote ${finalAction} successfully`,
      data: {
        upvoteCount: result.upvoteCount,
        hasUpvoted: finalAction === 'added'
      }
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Internal server error',
      error: error
    });
  }
};

export async function markHelpfulComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { comment_id, user_id, action } = req.body;

    if (!comment_id || !user_id || !action) {
      return res.json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(comment_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const comment = await Comments.findById(comment_id);
    if (!comment) {
      return res.json({
        success: false,
        message: 'Comment not found'
      });
    }

    const hasMarkedHelpful = comment.helpfules.some((helpfulId: mongoose.Types.ObjectId) => 
      helpfulId.toString() === user_id.toString()
    );

    const shouldMarkHelpful = (action === 'add' && !hasMarkedHelpful) || false;
    
    let updateOperation;
    let finalAction;

    if (shouldMarkHelpful) {
      updateOperation = {
        $addToSet: { helpfules: user_id },
        $inc: { helpfulCount: 1 },
        $set: { updatedAt: new Date() }
      };
      finalAction = 'added';
    } else {
      updateOperation = {
        $pull: { helpfules: user_id },
        $inc: { helpfulCount: -1 },
        $set: { updatedAt: new Date() }
      };
      finalAction = 'removed';
    }

    const result = await Comments.findByIdAndUpdate(
      comment_id,
      updateOperation,
      { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      message: `Marked helpful ${finalAction} successfully`,
      data: {
        helpfulCount: result.helpfulCount,
        hasMarkedHelpful: finalAction === 'added'
      }
    });

  } catch (error) {
    return res.json({
      success: false,
      message: 'Internal server error',
      error: error
    });
  }
};

export async function submitCommentReport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user_id, reason, description, comment_id } = req.body;

    if (!user_id || !reason) {
      return res.json({
        success: false,
        message: "User ID and reason are required"
      });
    }

    // Validate reason against enum values
    const validReasons = ['Spam', 'Harassment', 'Hate speech', 'Inappropriate content', 'False information', 'Other'];
    if (!validReasons.includes(reason)) {
      return res.json({
        success: false,
        message: "Invalid reason provided"
      });
    }

    // Check if comment exists
    const comment = await Comments.findById(comment_id);
    if (!comment) {
      return res.json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user has already reported this comment
    const existingReport = comment.reports.find(
      (report: any) => report.user_id.toString() === user_id
    );

    if (existingReport) {
      return res.json({
        success: false,
        message: "You have already reported this comment"
      });
    }

    const newReport = {
      user_id,
      reason,
      description: description || '',
      status: 'pending',
      created_at: new Date()
    };

    comment.reports.push(newReport);
    await comment.save();

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      message: "Comment reported successfully",
      data: {
        report: newReport,
        totalReports: comment.reports.length
      }
    });

  } catch (error) {
    console.error("Error submitting comment report:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error
    });
  }
};

export async function getAllComments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { filter } = req.body

    // Build query based on filter - only get top-level comments (no parent_id)
    const query: any = {
      $or: [
        { parent_id: { $exists: false } },
        { parent_id: null },
      ]
    }
    
    if (filter && filter !== 'all') {
      query.collection_name = filter
    }
    
    // Fetch main comments (without parent_id)
    const mainComments = await Comments.find(query)
      .populate({
        path: 'user_id',
        select: 'first_name last_name email profile_picture',
        model: 'User'
      })
      .sort({ created_at: -1 })
      .lean()

    // Enhance comments with post information and replies
    const enhancedComments = await Promise.all(
      mainComments.map(async (comment: any) => {
        let postInfo: any = null
        
        // Fetch post details based on collection_name
        switch (comment.collection_name) {
          case 'adventure_post':
            postInfo = await Tours.findById(comment.collection_id)
              .select('name image slug')
              .lean()
            break

          case 'adventure_guide':
            const postInfoTmp = await AGuide.findById(comment.collection_id)
              .select('title feature_image page_url')
              .lean()

              if(postInfoTmp){
                postInfo = {
                  name: (postInfoTmp as any).title,
                  image: (postInfoTmp as any).feature_image,
                  slug: (postInfoTmp as any).page_url,
                };
              }
            break

          case 'destination_story':
            const destination = await Destination.findOne({
              'stories.stories._id': comment.collection_id
            })
            .select('_id title page_url stories')
            .lean();
            
            // Fix: Properly type the destination and handle the nested structure
            if (destination && (destination as any).stories?.stories) {
              const stories = (destination as any).stories.stories;
              const story = stories.find(
                (s: any) => s._id.toString() === comment.collection_id.toString()
              );
              
              if (story) {
                postInfo = {
                  slug: (destination as any).page_url,
                  title: (destination as any).title,
                  name: story.name,
                  username: story.username,
                };
              }
            }
            break;

          case 'resort_story':
            const resort = await Resorts.findOne({
              'stories.stories_lists._id': comment.collection_id
            })
            .select('_id title page_url stories')
            .lean();
            
            // Fix: Properly type the resort and handle the nested structure
            if (resort && (resort as any).stories?.stories_lists) {
              const stories = (resort as any).stories.stories_lists;
              const story = stories.find(
                (s: any) => s._id.toString() === comment.collection_id.toString()
              );
              
              if (story) {
                postInfo = {
                  slug: (resort as any).page_url,
                  title: (resort as any).name,
                  name: story.name,
                  username: story.username,
                };
              }
            }
            break;

          case 'reviews':
            // Fix: Declare review variable and use comment.collection_id instead of _like.collection_id
            const review = await Reviews.findById(comment.collection_id)
              .select('_id user_id')
              .populate({
                path: 'user_id',
                select: 'first_name last_name email',
                model: 'User'
              });

            if (review && (review as any)?.user_id?.first_name) {
              postInfo = {
                name: `${(review as any)?.user_id?.first_name} ${(review as any)?.user_id?.last_name}`,
                username: (review as any)?.user_id?.email,
              };
            }
            break
            
          default:
            postInfo = { name: 'Unknown Post', image: '', slug: '#' }
        }

        // Fetch replies for this comment
        const replies = await Comments.find({ parent_id: comment._id.toString() })
          .populate({
            path: 'user_id',
            select: 'first_name last_name email profile_picture',
            model: 'User'
          })
          .sort({ created_at: 1 })
          .lean()

        // Enhance replies with user info
        const enhancedReplies = await Promise.all(
          replies.map(async (reply: any) => {
            return {
              ...reply,
              _id: reply._id.toString(),
              user_name: `${reply.user_id?.first_name || ''} ${reply.user_id?.last_name || ''}`.trim() || 'Deleted User',
              user_email: reply.user_id?.email, // Fixed: should be reply.user_id, not comment.user_id
              user_avatar: reply.user_id?.profile_picture,
              reports_count: reply.reports?.length || 0,
            }
          })
        )

        return {
          ...comment,
          _id: comment._id.toString(),
          user_name: `${comment.user_id?.first_name || ''} ${comment.user_id?.last_name || ''}`.trim() || 'Deleted User',
          user_email: comment.user_id?.email,
          user_avatar: comment.user_id?.profile_picture,
          post_title: postInfo?.title || postInfo?.name || '',
          post_image: postInfo?.image || '',
          post_url: postInfo?.slug || '',
          story_name: postInfo?.name || '',
          story_username: postInfo?.username || '',
          reports_count: comment.reports?.length || 0,
          replies: enhancedReplies,
          replies_count: enhancedReplies.length
        }
      })
    )

    return res.status(config.statusCode.SUCCESS).json({
      success: true, 
      comments: enhancedComments 
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return res.status(config.statusCode.INTERNAL_SERVER_ERROR).json({
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function getCommentById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const commentId = req.params.id;

    // Validate commentId
    if (!commentId) {
      return res.status(config.statusCode.BAD_REQUEST).json({
        success: false,
        message: 'Comment ID is required'
      });
    }

    // Fetch the main comment by ID with reporter information
    const comment = await Comments.findById(commentId)
      .populate({
        path: 'user_id',
        select: 'first_name last_name email profile_picture',
        model: 'User'
      })
      .populate({
        path: 'reports.user_id', // Populate reporter information from the reports array
        select: 'first_name last_name email profile_picture',
        model: 'User'
      })
      .lean() as any;

    // Check if comment exists
    if (!comment) {
      return res.json({
        success: false,
        message: 'Comment not found'
      });
    }

    let postInfo: any = null;
    
    // Fetch post details based on collection_name
    switch (comment.collection_name) {
      case 'adventure_post':
        postInfo = await Tours.findById(comment.collection_id)
          .select('name image slug')
          .lean();
        break;

      case 'adventure_guide':
        const postInfoTmp = await AGuide.findById(comment.collection_id)
          .select('title feature_image page_url')
          .lean()

          if(postInfoTmp){
            postInfo = {
              name: (postInfoTmp as any).title,
              image: (postInfoTmp as any).feature_image,
              slug: (postInfoTmp as any).page_url,
            };
          }
        break

      case 'destination_story':
        postInfo = await Destination.findById(comment.collection_id)
          .select('name image slug')
          .lean();
        break;

      case 'resort_story':
        postInfo = await Resorts.findById(comment.collection_id)
          .select('name image slug')
          .lean();
        break;

      case 'reviews':
        postInfo = await Reviews.findById(comment.collection_id)
          .select('name image slug')
          .lean();
        break;
      default:
        postInfo = { name: 'Unknown Post', image: '', slug: '#' };
    }

    // Fetch replies for this comment with reporter information
    const replies = await Comments.find({ parent_id: comment._id.toString() })
      .populate({
        path: 'user_id',
        select: 'first_name last_name email profile_picture',
        model: 'User'
      })
      .populate({
        path: 'reports.user_id', // Populate reporter information for replies
        select: 'first_name last_name email profile_picture',
        model: 'User'
      })
      .sort({ created_at: 1 })
      .lean();

    // Enhance replies with user info and reporter info
    const enhancedReplies = await Promise.all(
      replies.map(async (reply: any) => {
        return {
          ...reply,
          _id: reply._id.toString(),
          user_name: `${reply.user_id?.first_name || ''} ${reply.user_id?.last_name || ''}`.trim() || 'Deleted User',
          user_email: reply.user_id?.email,
          user_avatar: reply.user_id?.profile_picture,
          reports_count: reply.reports?.length || 0,
        };
      })
    );

    const enhancedComment = {
      ...comment,
      _id: comment._id.toString(),
      user_name: `${comment.user_id?.first_name || ''} ${comment.user_id?.last_name || ''}`.trim() || 'Deleted User',
      user_email: comment.user_id?.email,
      user_avatar: comment.user_id?.profile_picture,
      post_title: postInfo?.name || '',
      post_image: postInfo?.image || '',
      post_url: postInfo?.slug || '',
      reports_count: comment.reports?.length || 0,
      replies: enhancedReplies,
      replies_count: enhancedReplies.length
    };

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      comment: enhancedComment
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return res.status(config.statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getStoryById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    
    const storyID = req.body?.id
    const storyType = req.body?.story_type;

    if(storyID){
      if(storyType == 'destination_story'){
        const destination = await Destination.findOne({
          'stories.stories._id': storyID
        })
        .select('_id title image page_url stories');
        
        if (destination && destination.stories.stories) {
          const story = destination.stories.stories.find(
            (s: any) => s._id.toString() === storyID.toString()
          );
          
          if (story) {
            const postDetails = {
              _id: destination._id,
              post_url: destination.page_url,
              title: destination.title,
              image: destination.image,
              name: story.name,
              userprofile: story.userprofile,
              username: story.username,
              story_id: story._id
            };

            return res.status(config.statusCode.SUCCESS).json({
              success: true,
              data: postDetails,
            });
          }else{
             return res.json({
              success: false,
              message: 'Error fetching story post',
            });
          }
        }
      }else{
        const resort = await Resorts.findOne({
          'stories.stories_lists._id': storyID
        })
        .select('_id name image page_url stories');
        
        if (resort && resort.stories.stories_lists) {
          const story = resort.stories.stories_lists.find(
            (s: any) => s._id.toString() === storyID.toString()
          );
          
          if (story) {
            const postDetails = {
              _id: resort._id,
              post_url: resort.page_url,
              title: resort.name,
              image: resort.image,
              name: story.name,
              userprofile: story.userprofile,
              username: story.username,
              story_id: story._id
            };

            return res.status(config.statusCode.SUCCESS).json({
              success: true,
              data: postDetails,
            });
          }else{
             return res.json({
              success: false,
              message: 'Error fetching story post',
            });
          }
        }
      }
    }

  } catch (error) {
    return res.json({
      success: false,
      message: 'Error fetching story post',
      error: error
    });
  }
}

export async function getReviewById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reviewId = req.params.id;

    if(reviewId){
      const reviews = await Reviews.findById(reviewId)
        .select('review_text rating')
        .populate({
          path: 'user_id',
          select: 'first_name last_name profile_picture',
          model: 'User'
      });

      return res.status(config.statusCode.SUCCESS).json({
        success: true,
        review: reviews
      });
    }

  } catch (error) {
    return res.json({
      success: false,
      message: 'Error fetching story post',
      error: error
    });
  }
}

export async function updateReportStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const status = req.body.status;
    const reportId = req.body.reportId;

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: 'Invalid status. Must be one of: pending, reviewed, resolved, dismissed'
      });
    }

    const result = await Comments.findOneAndUpdate(
      { "reports._id": reportId },
      { 
        $set: { 
          "reports.$.status": status,
        } 
      },
      { new: true }
    );

    if (!result) {
      return res.json({
        success: false,
        message: 'Report not found'
      });
    }

    const updatedReport = result.reports.find(
      (report: any) => report._id.toString() === reportId
    );

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      message: 'Report status updated successfully',
      data: updatedReport
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    return res.json({
      success: false,
      message: 'Internal server error',
      error: error
    });
  }
};

export async function getCommentsReports(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const commentsWithReports = await Comments.find({ 
      "reports.0": { $exists: true }
    })
    .populate({
      path: "reports.user_id",
      select: "first_name last_name email profile_picture",
      model: "User"
    })
    .populate({
      path: "user_id",
      select: "first_name last_name email profile_picture",
      model: "User"
    })
    .sort({ "reports.created_at": -1 })
    .lean();

    // Transform the data to match your required format
    const reports = commentsWithReports.flatMap((comment: any) => 
      comment.reports.map((report: any) => ({
        reported_by: {
          name: `${report.user_id?.first_name || ''} ${report.user_id?.last_name || ''}`.trim() || 'Unknown',
          email: report.user_id?.email || "Unknown",
          profile_picture: report.user_id?.profile_picture || null
        },
        comment_of: {
          name: `${comment.user_id?.first_name || ''} ${comment.user_id?.last_name || ''}`.trim() || 'Unknown',
          email: comment.user_id?.email || "Unknown",
          profile_picture: comment.user_id?.profile_picture || null
        },
        collection_name: comment.collection_name,
        comment: comment.comment,
        report_created_date: report.created_at,
        report_reason: report.reason,
        report_description: report.description,
        report_status: report.status,
        _id: comment?._id.toString()
      }))
    );

    // Sort by report created date in DESC order (since populate doesn't support nested sort on arrays well)
    reports.sort((a, b) => 
      new Date(b.report_created_date).getTime() - new Date(a.report_created_date).getTime()
    );

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      data: reports,
      count: reports.length
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error
    });
  }
};