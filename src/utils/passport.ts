import passport from "passport";
import passportJWT from "passport-jwt";

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

import constants from "../configs/constants";
import { IUser } from "../interfaces/user";
import HttpException from "./http.exception";
import mongoose from "mongoose";

const User = mongoose.model("User");
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: constants.config.APP_SECRET,
    },
    (jwtPayload, cb) =>
      User.findById(jwtPayload.id)
        .then((user: IUser | undefined | null) => {
          if (!user)
            throw new HttpException(
              constants.statusCode.UNAUTHORIZED,
              constants.MESSAGES.UNAUTHORIZED,
              ""
            );
          else if (user.status != constants.statusConstants.USER_STATUS.ACTIVE)
            throw new HttpException(
              constants.statusCode.UNAUTHORIZED,
              constants.MESSAGES.USER.USER_EXIST_WITH_EMAIL_AND_INACTIVATED,
              ""
            );
          return cb(null, user as IUser);
        })
        .catch((err) => {
          console.log("error:- in passport ", err);
          return cb(err);
        })
  )
);
