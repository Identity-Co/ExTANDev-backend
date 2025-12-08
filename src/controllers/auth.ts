import { Request, Response, NextFunction } from "express";
import HttpException from "../utils/http.exception";
import {
  loginSchemaValidator,
  forgetPasswordSchemaValidator,
  forgetPasswordRequestSchemaValidator,
} from "../validators/auth";
import constants from "../configs/constants";
import bcrypt from "bcrypt";
import * as helpers from "../helpers/helper";
import TwilioService from "../services/twilio";
import SendGridEmailService from "../services/sendgrid.mail";
import mongoose, { Types } from "mongoose";
import { IUser } from "../interfaces/user";

const axios = require('axios');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(`899760202984-plt5aioi3p8ctsr3tvroku9v9hm4ad25.apps.googleusercontent.com`);

const User = mongoose.model("User");

export async function login(req: Request, res: Response, next: NextFunction) {
  // console.log(req.body);
  try {
    const { error } = loginSchemaValidator(req.body);
    if (error) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        error.details[0].message,
        "login"
      );
    }

    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      throw new HttpException(
        constants.statusCode.UNAUTHORIZED,
        "User does not exist",
        "login"
      );
    }
    if (userData && userData.status == 0) {
      throw new HttpException(
        constants.statusCode.UNAUTHORIZED,
        "This user account has been deactivated.",
        "login"
      );
    }
    const isPasswordMatch = await bcrypt.compare(password, userData.password);
    if (!isPasswordMatch) {
      throw new HttpException(
        constants.statusCode.UNAUTHORIZED,
        "Invalid password",
        "login"
      );
    }
    const token = await helpers.generateJWToken(userData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        first_name: userData.first_name,
        last_name: userData.last_name,
        name: userData.first_name+' '+userData.last_name,
        role: userData.role,
        profile_picture: userData.profile_picture,
        id: userData._id,
        phone: userData.phone,
        ambassador_status: userData.ambassador_status ?? 0,
        membership_level: userData.membership_level ?? 0,
        access_uid: userData.access_uid ?? ''
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function glogin(req: Request, res: Response, next: NextFunction) {
  const { _token } = req.body;
  try {
      const userRole = req.body?.role || 'user'
      const ticket = await client.verifyIdToken({
          idToken: req.body.token,
          audience: '899760202984-plt5aioi3p8ctsr3tvroku9v9hm4ad25.apps.googleusercontent.com',
      });
      const payload = ticket.getPayload();

      let user = await User.findOne({ email: payload.email });

      if (user) {
        if(user.provider == "" || user.provider === undefined) res.status(200).json({ message: 'User with this email already exist.' });
      }

      if (!user) {
          let _name = payload.name;
          let split_name = _name.split(' ');

          const randomString = payload.email+'_'+payload.sub;
          const hashedPassport = await helpers.hashPassword(randomString);

          user = await User.create({
              first_name: split_name[0],
              last_name: split_name[1],
              name: payload.name,
              password: hashedPassport,
              email: payload.email,
              googleId: payload.sub,
              provider: 'google',
              role: userRole
          });
      }

      const token = await helpers.generateJWToken(user);
      // res.json({ token, ...user });
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          first_name: user.first_name,
          last_name: user.last_name,
          name: user.first_name+' '+user.last_name,
          role: user.role,
          email: user.email,
          profile_picture: user.profile_picture,
          id: user._id,
          googleId: user.googleId,
          phone: user.phone,
          ambassador_status: user.ambassador_status ?? 0,
          membership_level: user.membership_level ?? 0,
          access_uid: user.access_uid ?? ''
        },
      });
  } catch (error) {
      // res.status(400).json({ message: 'Invalid Google token' });
    next(error);
  }
}

export async function flogin(req: Request, res: Response, next: NextFunction) {
  const { accessToken } = req.body;
  const userRole = req.body?.role || 'user'
  
  try {
    // Verify token with Facebook Graph API
    const fbRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const fbData = fbRes.data;

    let user = await User.findOne({ email: fbData.email });

    if (user) {
      throw new HttpException(
        constants.statusCode.UNAUTHORIZED,
        "User with this email already exist.",
        "login"
      );
    }

    const randomString = fbData.email+'_'+fbData.id;
    const hashedPassport = await helpers.hashPassword(randomString);

    let _name = fbData.name;
    let split_name = _name.split(' ');

    user = await User.create({
      first_name: split_name[0],
      last_name: split_name[1],
      name: fbData.name,
      email: fbData.email,
      password: hashedPassport,
      fbId: fbData.id,
      provider: 'facebook',
      role: userRole
    });

    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const token = await helpers.generateJWToken(user);
    // res.json({ token, user });
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          first_name: user.first_name,
          last_name: user.last_name,
          name: user.first_name+' '+user.last_name,
          role: user.role,
          email: user.email,
          profile_picture: user.profile_picture,
          id: user._id,
          fbId: user.fbId,
          phone: user.phone??null,
          ambassador_status: user.ambassador_status ?? 0,
          membership_level: user.membership_level ?? 0,
          access_uid: user.access_uid ?? ''
        },
      });
  } catch (err) {
    res.status(400).json({ message: 'Invalid Facebook token' });
  }
}

export async function setSecurityQuestions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const requestUser = req.user as IUser;
    if (requestUser.reset_questions_available) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        "security questions already set",
        "setSecurityQuestions"
      );
    }
    const user = await User.findByIdAndUpdate(
      { _id: requestUser._id },
      {
        reset_questions_available: true,
        reset_questions: req.body.reset_questions,
      },
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: true,
      message: "security questions set successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSecurityQuestions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const email = req.query.email as string;
    const user = await User.findOne({ email });

    console.log(email, user)
    if (!user) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        "user not found",
        "getSecurityQuestions"
      );
    }
    if (!user.reset_questions_available || !user.reset_questions) {
      /* throw new HttpException(
        constants.statusCode.NO_CONTENT,
        "security questions not set",
        "getSecurityQuestions"
      ); */
      return res.status(200).json({
        success: false,
        message: "security questions not set"
      });
    }
    // get random question
    const question =
      user.reset_questions[
        Math.floor(Math.random() * user.reset_questions.length)
      ];
    return res.status(200).json({
      success: true,
      message: "security questions fetched successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgetPasswordRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { error } = forgetPasswordRequestSchemaValidator(req.body);
    if (error) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        error.details[0].message,
        "forgetPasswordRequest"
      );
    }
    const { email } = req.body;
    const user = await User.findOne({
      email: email,
      status: constants.statusConstants.USER_STATUS.ACTIVE,
    });
    if (!user)
      throw new HttpException(
        constants.statusCode.NOTFOUND,
        "user not found",
        "forgetPasswordRequest"
      );

    const forgetToken = await helpers.createHash();
    const forgetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const emailServiceObj = new SendGridEmailService(
      constants.ADMIN_CONSTANTS.SENDGRID_FROM_EMAIL,
      constants.ADMIN_CONSTANTS.SENDGRID_API_KEY
    );

    const sendEmailRespone = await emailServiceObj.sendEmail({
      to: user.email,
      subject: `${user.first_name} ${user.last_name}! Forget your password`,
      html: `<p>Hi ${user.first_name} ${user.last_name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${constants.config.CLIENT_URL}/reset-password?email=${email}&token=${forgetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>Thanks,<br>Adventure Network Team</p>`,
    });

    if (!sendEmailRespone) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        "failed to send email",
        "forgetPasswordRequest"
      );
    }
    await User.findByIdAndUpdate(user._id, {
      reset_token: forgetToken,
      reset_token_expiry: forgetTokenExpiry,
    });
    return res.status(200).json({
      success: true,
      message: "forget password link sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgetPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { error } = forgetPasswordSchemaValidator(req.body);
    if (error) {
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        error.details[0].message,
        "forgetPassword"
      );
    }
    const { email, token, password } = req.body;

    const user = await User.findOne({
      email: email,
      status: constants.statusConstants.USER_STATUS.ACTIVE,
    });
    if (!user)
      throw new HttpException(
        constants.statusCode.NOTFOUND,
        "user not found",
        "forgetPassword"
      );
    if (user.reset_token !== token)
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        "invalid token",
        "forgetPassword"
      );
    if (user.reset_token_expiry < new Date())
      throw new HttpException(
        constants.statusCode.BAD_REQUEST,
        "token expired",
        "forgetPassword"
      );

    const hashedPassport = await helpers.hashPassword(password);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassport,
      reset_token: null,
      reset_token_expiry: null,
    });
    return res.status(200).json({
      success: true,
      message: "password reset successfully",
    });
  } catch (error) {
    next(error);
  }
}


export async function loginAsUser(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const userId = new Types.ObjectId(req.body.user_id);

    const userData = await User.findById(userId);
    if (!userData) {
      throw new HttpException(
        constants.statusCode.UNAUTHORIZED,
        "User does not exist",
        "login"
      );
    }

    const token = await helpers.generateJWToken(userData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        profile_picture: userData.profile_picture,
        id: userData._id,
        reset_questions_available: userData.reset_questions_available,
        phone: userData.phone,
        permissions: userData.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
}