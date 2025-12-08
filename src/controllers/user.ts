import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import { userSchemaValidator } from "../validators/user";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { hashPassword } from "../helpers/helper"; //, createHash
import { UploadRequest } from '../types/UploadRequest';
import bcrypt from "bcrypt";

import fs from 'fs';
import path from 'path';

// import TwilioService from "../services/twilio";
// import SendGridEmailService from "../services/sendgrid.mail";

const User = mongoose.model("User");

// Output File path
const dirPath = path.join('public','uploads');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('Directory created');
}

try {
  fs.chmodSync(dirPath, 0o777);
  console.log('Permissions changed to 777');
} catch (err) {
  console.error('Failed to change permissions:', err);
}


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
                    <img src="{{site_url}}/images/head-logo.png" width="200" alt="" border="0"> 
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
                              <h2 style="color: #333;">Verify Your Account</h2>

                              <p style="color: #555; font-size: 15px; line-height: 22px;">
                                Hi {{name}},<br><br>
                                Thank you for registering with us! To complete your account setup and ensure the security of your information, please verify your email address.
                              </p>

                              <center>
                                <a href="{{verification_link}}" 
                                   style="display: inline-block; padding: 12px 22px; background-color: #4CAF50; color: #ffffff; 
                                          text-decoration: none; border-radius: 5px; font-size: 16px; margin: 20px 0;">
                                  Verify My Account
                                </a>
                              </center>

                              <p style="color: #555; font-size: 15px; line-height: 22px;">
                                If the button above doesn’t work, copy and paste the following link into your browser:
                              </p>

                              <p style="color: #4CAF50; word-break: break-all; font-size: 14px;">
                                {{verification_link}}
                              </p>

                              <p style="color: #777; font-size: 13px; margin-top: 25px;">
                                If you didn’t create an account, you can safely ignore this email.
                              </p>

                              <p style="color: #999; font-size: 12px; margin-top: 40px;">
                                Regards,<br>
                                <strong>Adventure Network</strong>
                              </p>
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
    let users:any = [];
    users = await User.find({
      role: { $ne: 'admin' }
    });
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function listLimited(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = Number(req.params.limit);
    const requestUser = req.user as IUser;

    const agent = await User.find({
      role: { $ne: 'admin' }
    }).limit(limit);

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await User.findOne({
      _id: _id,
    });

    console.log(_id, data);

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "User with this id not found",
        "get user data"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}


export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    //const requestUser = req.user as IUser;

    /* const RECAPTCHA_SECRET = "6LdfK7orAAAAAM_xmyZ1UiR4OD92JycTG6iKyUle";

    try {
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captcha}`,
        { method: "POST" }
      );
      const c_data = await response.json();

      if(c_data.success) {
        console.error('c_data.success: ', c_data.success);
        // Final submition code here...
      } else {
        console.error('Failed: Captcha verification failed');
      }
    } catch (error) {
      console.error('error: ', error);
    } */

    // const email = req.body.email.toLowerCase();
    const email = req.body.email;
    const checkActiveUser = await User.findOne({
      email: email,
      status: { $ne: config.statusConstants.USER_STATUS.DELETED },
    });
    if (checkActiveUser) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "user with this email already exist",
        "createUser"
      );
    }
    const checkDeletedUser = await User.findOne({
      email: email,
      status: config.statusConstants.USER_STATUS.DELETED,
    });
    if (checkDeletedUser) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "user with this email already exist and deleted",
        "createUser"
      );
    }
    const hashedPassword = await hashPassword(req.body.password);
    const c_year = new Date().getFullYear();
    const access_uid = 'AN' + c_year + (Date.now().toString(36) + Math.random().toString(36).substr(2, 10));

    /* const emailServiceObj = new SendGridEmailService(
      config.ADMIN_CONSTANTS.SENDGRID_FROM_EMAIL,
      config.ADMIN_CONSTANTS.SENDGRID_API_KEY
    );

    const verificationToken = ''; //await createHash();
    const verificationLink = `${config.config.CLIENT_URL}/verify-account/?email=${email}&token=${verificationToken}";

    const emailHtml = adminEmailTemplate;
      //.replace('{{name}}', req.body.first_name.' '.req.body.last_name)
      //.replace('{{verification_link}}', verificationLink)
      //.replace('{{site_url}}', config.config.CLIENT_URL)

    const sendEmailRespone = await emailServiceObj.sendEmail({
      to: ['eptdeveloper@gmail.com'],
      subject: 'New submission from contact form ',
      html: emailHtml,
    }); */

    const createdUser = await User.create({
      ...req.body,
      email: email,
      password: hashedPassword,
      access_uid: access_uid,
    });

    if(createdUser) {
      const access_url = config.ACCESS_API.ACCESS_API_URL
      const access_token = config.ACCESS_API.ACCESS_TOKEN
      const org_cust_id = config.ACCESS_API.ORGANIZATION_ID
      const pro_cust_id = config.ACCESS_API.PROGRAM_ID

      const access_data = {
        import: {
          members: [
            {
              organization_customer_identifier: org_cust_id,
              program_customer_identifier: pro_cust_id,
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              email_address: req.body.email,
              member_customer_identifier: access_uid,
              member_status: "OPEN"
            }
          ]
        }
      };

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Token': access_token
      };

      async function sendAccessRequest() {
        try {
          const response = await fetch(access_url + '/api/v1/imports', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(access_data)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          //console.log(result.data.id, result.data.valid_members_count);
        } catch (error) {
          console.error('Access API Error:', error);
        }
      }

      sendAccessRequest();
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: createdUser });
  } catch (error) {
    next(error);
  }
}

export async function updateUser (
  req: Request,
  res: Response,
  next: NextFunction
){
  try {
    const requestUser = req.user as IUser;
    const _id = new Types.ObjectId(req.params.id);
    let body = req.body;

    if(req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const file = req.file;
    // console.log(file)

    const user = await User.findOne({
      _id: _id,
    });

    if (!user)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "User not exist",
        "updateUser"
      );

    let avatar = (file != undefined) ? `uploads/${file?.filename}` : null;

    if(user && user.profile_picture !== undefined && file === undefined)
      avatar = user.profile_picture;
    
    const updatedUser = await User.findByIdAndUpdate(
        _id,
        { ...body, 'profile_picture': avatar },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error)
  }
}

export async function deleteUser (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const requestUser = req.user as IUser;
    const _id = new Types.ObjectId(req.params.id);

    const user = await User.findOne({
      _id: _id,
    });

    if (!user)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Agent with this id not found",
        "delete user data"
      );

    const deletedAgent = await User.findByIdAndDelete(_id);

    console.log(deletedAgent);
    return res.status(config.statusCode.SUCCESS).json({ success: true, user });
  } catch (error) {
    next(error)
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const requestUser = req.user as IUser;
    const { current_password, password } = req.body;

    const user = await User.findOne({
      _id: requestUser._id,
    });

    if (!user)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Agent with this id not found",
        "delete user data"
      );

    const isPasswordMatch = await bcrypt.compare(current_password, user.password);
    if (!isPasswordMatch) {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        "Invalid password",
        "changePassword"
      );
    }

    const hashedPassword = await hashPassword(password);
      
    const updatedUser = await User.findByIdAndUpdate(
        requestUser._id,
        { 'password': hashedPassword },
        { new: true }
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data:updatedUser });
  } catch (error) {
    next(error)
  }
}