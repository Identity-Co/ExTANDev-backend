import Joi from "joi";
import {
  ILoginSchema,
  IForgetPasswordSchema,
  IForgetPasswordRequestSchema,
} from "../interfaces/auth";
import constants from "../configs/constants";

export const loginSchemaValidator = (body: ILoginSchema) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    two_factor_code: Joi.string().optional(),
  });
  return schema.validate(body);
};

export const forgetPasswordRequestSchemaValidator = (
  body: IForgetPasswordRequestSchema
) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  return schema.validate(body);
};

export const forgetPasswordSchemaValidator = (body: IForgetPasswordSchema) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    password: Joi.string().required(),
  });
  return schema.validate(body);
};
