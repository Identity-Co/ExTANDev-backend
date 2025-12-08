import { NextFunction, Request, Response } from "express";
import config from "../configs/constants";
import {
  createSettingSchema,
  updateSettingSchema,
} from "../validators/settings";
import HttpException from "../utils/http.exception";
import mongoose, { Types } from "mongoose";
import { IUser } from "../interfaces/user";
import { loadConfigVariables } from "../helpers/load.config";

const Setting = mongoose.model("Setting");
// const Company = mongoose.model("Company");

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const { error } = createSettingSchema(req.body);
    if (error) {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        error.details[0].message,
        "create"
      );
    }
    const setting = await Setting.findOne({
      key: req.body.key,
    });
    if (setting)
      throw new HttpException(
        config.statusCode.CONFLICT,
        "setting with this key already exists",
        "create"
      );
    let data;
    if (
      req.body.setting_type == config.valueConstants.SETTING_TYPE.ADMIN
    ) {
      data = await Setting.create({
        ...req.body,
        value: config.valueConstants.SETTING_SUPER_ADMIN_CONSTANT,
      });
      /*const allCompanies = await Company.find({});
      const allCompaniesPromise = allCompanies.map((company) => {
        data = Setting.create({
          key: req.body.key,
          company_id: company._id,
          setting_type: config.valueConstants.SETTING_TYPE.ADMIN,
        });
      });
      await Promise.all(allCompaniesPromise);*/
    } else if (
      req.body.setting_type == config.valueConstants.SETTING_TYPE.ADMIN
    ) {
      data = await Setting.create({
        ...req.body,
      });
    }
    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reloadSetting(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    loadConfigVariables();
    return res.status(config.statusCode.SUCCESS).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { error } = updateSettingSchema(req.body);
    if (error) {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        error.details[0].message,
        "update setting data"
      );
    }
    const settingId = new Types.ObjectId(req.params.settingId);
    const user = req.user as IUser;
    const setting = await Setting.findById({
      _id: settingId,
    });
    if (!setting)
      throw new HttpException(
        config.statusCode.NOTACCEPTABLE,
        "setting with this id not found",
        "update setting data"
      );
    let data;
    if (
      (setting.setting_type ===
        config.valueConstants.SETTING_TYPE.ADMIN &&
        user.role === config.ROLE.USER.ADMIN)
    ) {
      data = await Setting.findByIdAndUpdate(
        { _id: settingId },
        { ...req.body },
        { new: true }
      );
    } else {
      throw new HttpException(
        config.statusCode.UNAUTHORIZED,
        "You are not authorized to update this setting",
        "update setting data"
      );
    }

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const settingId = new Types.ObjectId(req.params.settingId);
    const setting = await Setting.findById({
      _id: settingId,
    });
    if (!setting)
      throw new HttpException(
        config.statusCode.NOTACCEPTABLE,
        "setting with this id not found",
        "deleteSettingDetails"
      );
    if (
      setting.setting_type === config.valueConstants.SETTING_TYPE.ADMIN
    ) {
      await Setting.deleteOne({ _id: settingId });
    } else if (
      setting.value != config.valueConstants.SETTING_SUPER_ADMIN_CONSTANT
    ) {
      throw new HttpException(
        config.statusCode.NOTACCEPTABLE,
        "can not delete this setting",
        "deleteSettingDetails"
      );
    } else if (
      setting.setting_type === config.valueConstants.SETTING_TYPE.ADMIN
    ) {
      await Setting.deleteMany({ key: setting.key });
    }
    return res.status(config.statusCode.SUCCESS).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getAllSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const settingType = req.params.settingType;
    let settings;
    if (settingType === config.valueConstants.SETTING_TYPE.ADMIN) {
      settings = await Setting.find({
        setting_type: config.valueConstants.SETTING_TYPE.ADMIN,
      });
    }
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function getAllCompanyAdminSetting(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as IUser;
    const settings = {};
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {    
    const body = req.body;
    const _key = req.body.key;

    const user = req.user as IUser;

    const setting = await Setting.findOne({
      key: _key,
    });

    let data;
    if (!setting)
      data = await Setting.create({ ...body });
    else
      if (
        (setting.setting_type ===
          config.valueConstants.SETTING_TYPE.ADMIN &&
          user.role === config.ROLE.USER.ADMIN)
      ) {
        data = await Setting.findByIdAndUpdate(
          { _id: setting._id },
          { ...body },
          { new: true }
        );
      } else {
        throw new HttpException(
          config.statusCode.UNAUTHORIZED,
          "You are not authorized to update this setting",
          "update setting data"
        );
      }

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}