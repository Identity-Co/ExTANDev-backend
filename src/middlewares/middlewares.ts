import { Response, Request, NextFunction } from "express";
import constants from "../configs/constants";
import { IUser } from "../interfaces/user";
import mongoose from "mongoose";

const User = mongoose.model("User");

export const checkPermissions = (module: string) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(constants.statusCode.UNAUTHORIZED).json({
        success: false,
        message: "User is not authenticated",
      });
    }
    const requestUser = req.user as IUser;

    const user = await User.findOne({
      _id: requestUser._id,
      status: constants.statusConstants.USER_STATUS.ACTIVE,
    }).lean();

    if (!user) {
      return res.status(constants.statusCode.NOTFOUND).json({
        success: false,
        message: constants.MESSAGES.USER.REQUEST_USER_NOT_FOUND,
      });
    }
    const permissions = requestUser.permissions || [];
    
    const isForbidden = () => {
      return res.status(constants.statusCode.FORBIDDEN).json({
        success: false,
        message: constants.MESSAGES.PERMISSION_DENIED,
      });
    };

    switch (module) {
      default:
        // If NOT admin
        if (requestUser.role !== 'admin') {
          
          if (requestUser.role === 'ambassador') {
            if (module !== 'adventure_guide') {
              return isForbidden();
            }
            break;
          }

          if (requestUser.role === 'property_owner') {
            if (module !== 'resorts' && module !== 'single_users') {
              return isForbidden();
            }
            break;
          }

          const forbiddenModules = [
            'banners',
            'cms-home',
            'custom-categories',
            'adventure_guide',
            'contactForm',
            'reviewEntry',
            'commentsLists',
            'shareData',
            'generalSettings',
            'resorts',
          ];

          if (forbiddenModules.includes(module)) {
            return isForbidden();
          }
        }

        break;
    }
    next();
  };
};
