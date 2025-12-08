import joi from "joi";

export const addressSchema = joi.object({
  address: joi.string().required().allow(""),
  address2: joi.string().allow(null, "").optional(),
  city: joi.string().required(),
  state: joi.string().required(),
  zip: joi.string().required(),
  country: joi.string().required(),
});

export const phoneSchema = joi.object({
  country_code: joi.string().required(),
  number: joi.string().required(),
  extension: joi.string().allow(null, "").optional(),
});
