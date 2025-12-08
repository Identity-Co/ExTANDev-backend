import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import TwilioService from "../services/twilio";
import SendGridEmailService from "../services/sendgrid.mail";

import util from "util";

const ContactFormEntries = mongoose.model("ContactFormEntries");

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
                                <p style="font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif; font-size: 13px; line-height: 150%; margin:0 0 15px;">Here is the information from the contact form submission:</p>
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
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Country:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{country}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Phone:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{phone}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">How can we help?:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{how_we_help}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">Get monthly inspiration. Subscribe to our newsletter:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{subscribe_newsletter}}</td>
                                              </tr>
                                              <tr>
                                                  <td colspan="2" style="border-bottom: 1px solid #e1e5e9; padding: 0;"></td>
                                              </tr>
                                              <tr>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; padding: 10px 0;">I agree to receive other communications fro Adventure Network:</td>
                                                  <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #4a4a4a; padding: 10px 0;">{{agree_communication}}</td>
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
    let query = ContactFormEntries.find().sort({ created_at: -1 });

    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      query = query.select(fieldArray);
    }
    
    formData = await query;
    
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
    const formData = await ContactFormEntries.findOne({
      _id: _id,
    });

    if (!formData)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Entry not found",
        "getEntry"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: formData });
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

    const formData = await ContactFormEntries.create({
      ...req.body,
    });

    const emailServiceObj = new SendGridEmailService(
      config.ADMIN_CONSTANTS.SENDGRID_FROM_EMAIL,
      config.ADMIN_CONSTANTS.SENDGRID_API_KEY
    );

    const emailHtml = adminEmailTemplate
      .replace('{{first_name}}', req.body.first_name?? '')
      .replace('{{last_name}}', req.body.last_name?? '')
      .replace('{{email}}', req.body.email_address?? '')
      .replace('{{country}}', req.body.country?? '')
      .replace('{{phone}}', req.body.phone?? '')
      .replace('{{how_we_help}}', req.body.how_can_help?? '')
      .replace('{{subscribe_newsletter}}', req.body?.subscribe_newsletter ? 'Yes' :  'No')
      .replace('{{agree_communication}}', req.body?.agree_communication ? 'Yes' : 'No')
      .replace('{{ip_address}}', req.body.ip_address?? '')

    const sendEmailRespone = await emailServiceObj.sendEmail({
      to: ['eptdeveloper@gmail.com'],
      subject: 'New submission from contact form ',
      html: emailHtml,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: formData });
  } catch (error) {
    next(error);
  }
}

export async function deleteEntry (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const entry = await ContactFormEntries.findOne({
      _id: _id,
    });

    if (!entry)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Contact Entry with this id not found",
        "deleteEntry"
      );

    const _del = await ContactFormEntries.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, entry });
  } catch (error) {
    next(error)
  }
}