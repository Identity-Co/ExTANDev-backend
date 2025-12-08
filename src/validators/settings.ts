import Joi, { string } from "joi";
import { ISettings } from "../interfaces/settings";
import config from "../configs/constants";

export const createSettingSchema = (data: Partial<ISettings>) => {
  const schema = Joi.object().keys({
    key: Joi.string().max(100).required(),
    setting_type: Joi.string()
      .max(100)
      .allow(
        config.valueConstants.SETTING_TYPE.ADMIN,
      )
      .required(),
    /*value: Joi.alternatives().conditional("setting_type", {
      is: config.valueConstants.SETTING_TYPE.SUPER_ADMIN,
      then: Joi.string().required(),
      otherwise: Joi.forbidden(), // `value` is not allowed when `setting_type` is "COMPANY_ADMIN"
    }),*/
  });
  return schema.validate(data);
};

export const updateSettingSchema = (data: Partial<ISettings>) => {
  const schema = Joi.object().keys({
    value: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
  });
  return schema.validate(data);
};
