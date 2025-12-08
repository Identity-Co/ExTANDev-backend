import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { loadConfigVariables } from "../helpers/load.config";

import fs from 'fs';
import path from 'path';
import multer from "multer";
import util from "util";

const GeneralSetting = mongoose.model("GeneralSetting");

const SENSITIVE_KEYS = [
  'admin_email',
  'sendgrid_from_email',
  'sendgrid_api_key',
];

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

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    // Create directory recursively with proper permissions
    await fs.promises.mkdir(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
}

export async function updateGeneralSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const updateData = { ...req.body };
    const oldData = await GeneralSetting.findOne({});
  
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const logosDir = path.join(uploadsDir, 'logos');

    await ensureDirectoryExists(publicDir);
    await ensureDirectoryExists(uploadsDir);
    await ensureDirectoryExists(logosDir);

    if(updateData.header_logo && isBase64Image(updateData.header_logo)){
      const matches = updateData.header_logo.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      const originalFileName = updateData.header_logo_file || 'header-logo';
      const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}-${sanitizedFileName}`;
      const savePath = path.join(logosDir, uniqueName);

      await fs.promises.writeFile(savePath, buffer);

      if (oldData?.header_logo) {
        const oldFilePath = path.join(publicDir, oldData.header_logo);
        safeDeleteFile(oldFilePath);
      }

      delete updateData['header_logo_file'];
    
      updateData.header_logo = path.join('uploads', 'logos', uniqueName).replace(/\\/g, '/');
    }else{
        if(!updateData.header_logo){
          updateData.header_logo = '';

          if (oldData?.header_logo) {
            const oldFilePath = path.join(publicDir, oldData.header_logo);
            safeDeleteFile(oldFilePath);
          }
        }
    }

    if(updateData.footer_logo && isBase64Image(updateData.footer_logo)){
      const matches = updateData.footer_logo.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      const originalFileName = updateData.footer_logo_file || 'footer-logo';
      const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}-${sanitizedFileName}`;
      const savePath = path.join(logosDir, uniqueName);

      await fs.promises.writeFile(savePath, buffer);

      if (oldData?.footer_logo) {
        const oldFilePath = path.join(publicDir, oldData.footer_logo);
        safeDeleteFile(oldFilePath);
      }

      delete updateData['footer_logo_file'];
      
      updateData.footer_logo = path.join('uploads', 'logos', uniqueName).replace(/\\/g, '/');
    }else{
        if(!updateData.footer_logo){
          updateData.footer_logo = '';

          if (oldData?.footer_logo) {
            const oldFilePath = path.join(publicDir, oldData.footer_logo);
            safeDeleteFile(oldFilePath);
          }
        }
    }

    const settings = await GeneralSetting.findOneAndUpdate({},
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    loadConfigVariables();

    return res.status(config.statusCode.SUCCESS).json({ 
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGeneralSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const settings = await GeneralSetting.findOne({});
  
    if (!settings) {
      return res.status(config.statusCode.SUCCESS).json({ 
        success: true,
        message: "No settings found",
        data: {},
      });
    }

    return res.status(config.statusCode.SUCCESS).json({ 
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { keys } = req.query;

    const SENSITIVE_KEYS = [
      'sendgrid_api_key',
      'admin_email',
      'sendgrid_from_email'
    ];

    const MONGOOSE_INTERNALS = ['_id', '__v', 'created_at', 'updated_at'];

    if (!keys) {
      return res.json({
        success: false,
        message: "Please provide settings keys as query parameter"
      });
    }

    const settings = await GeneralSetting.findOne({});
    
    if (!settings) {
      return res.json({
        success: false,
        message: "Settings not found"
      });
    }

    const settingsObj = settings.toObject ? settings.toObject() : settings;

    // Fix: Properly type the keys and ensure they are strings
    const requestedKeys = (typeof keys === 'string' 
      ? keys.split(',').map(key => key.trim())
      : Array.isArray(keys) ? keys.map(key => String(key)) : []) as string[];

    const safeKeys = requestedKeys.filter(key => 
      !SENSITIVE_KEYS.includes(key) && 
      !MONGOOSE_INTERNALS.includes(key)
    );

    if (safeKeys.length === 0) {
      return res.json({
        success: false,
        message: "No valid public settings keys requested"
      });
    }

    // Fix: Use proper typing for the publicSettings object
    const publicSettings: Record<string, any> = {};
    safeKeys.forEach(key => {
      if (settingsObj[key as keyof typeof settingsObj] !== undefined) {
        publicSettings[key] = settingsObj[key as keyof typeof settingsObj];
      }
    });

    if (Object.keys(publicSettings).length === 0) {
      return res.json({
        success: false,
        message: "No settings found for the requested keys"
      });
    }

    return res.status(config.statusCode.SUCCESS).json({ 
      success: true,
      data: publicSettings
    });

  } catch (error) {
    next(error);
  }
}

export async function getSettingsByKeysAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { keys } = req.body;
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.json({
        success: false,
        message: "Please provide an array of setting keys"
      });
    }

    // Fix: Ensure keys are strings
    const stringKeys = keys.map(key => String(key));
    let filteredKeys = stringKeys;


    const settings = await GeneralSetting.findOne({});
    
    if (!settings) {
      return res.json({
        success: false,
        message: "Settings not found"
      });
    }

    // Fix: Use proper typing for filteredSettings
    const filteredSettings: Record<string, any> = {};
    filteredKeys.forEach(key => {
      if (settings[key as keyof typeof settings] !== undefined) {
        filteredSettings[key] = settings[key as keyof typeof settings];
      }
    });

    if (Object.keys(filteredSettings).length === 0) {
      return res.json({
        success: false,
        message: "No matching settings found for the provided keys"
      });
    }

    return res.status(config.statusCode.SUCCESS).json({ 
      success: true,
      data: filteredSettings
    });

  } catch (error) {
    next(error);
  }
}