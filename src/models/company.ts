import mongoose from "mongoose";
const { Schema } = mongoose;
import { ICompany } from "../interfaces/company";
import { addressSchema, phoneSchema } from "./common";
import constants from "../configs/constants";

const CompanySchema = new Schema(
  {
    company_name: {
      type: String,
      required: true,
    },
    company_address: {
      type: addressSchema,
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: Number,
      default: constants.statusConstants.COMPANY_STATUS.ACTIVE,
      enum: [
        constants.statusConstants.COMPANY_STATUS.ACTIVE,
        constants.statusConstants.COMPANY_STATUS.INACTIVE,
        constants.statusConstants.COMPANY_STATUS.DELETED,
      ],
    },
    company_email: {
      type: String,
      required: true,
    },
    company_phone: {
      type: phoneSchema,
      required: true,
    },
  },

  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ICompany>("Company", CompanySchema);
