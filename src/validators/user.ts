import joi from "joi";
import { IUser } from "../interfaces/user";
import config from "../configs/constants";
import { addressSchema, phoneSchema } from "./common";

export const userSchemaValidator = (data: Partial<IUser>) => {
  const schema = joi.object({
    first_name: joi.string().required().min(2),
    last_name: joi.string().required().min(2),
    email: joi.string().email().required(),
    password: joi.string().required().min(8),
    role: joi.string().required(),
    address: addressSchema.optional(),
    phone: phoneSchema.required()
  });

  return schema.validate(data);
};