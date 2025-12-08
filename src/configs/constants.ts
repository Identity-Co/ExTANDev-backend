import dotenv from "dotenv";
dotenv.config();

export default {
  config: {
    PORT: Number(process.env.PORT),
    DATABASE_URL: String(process.env.DATABASE_URL),
    APP_SECRET: String(process.env.APP_SECRET),
    CLIENT_URL: String(process.env.CLIENT_URL),
    SERVER_URL: String(process.env.SERVER_URL),
    API_URL: String(process.env.API_URL),
    RUN_CRONS: String(process.env.RUN_CRONS)
  },
  statusCode: {
    SUCCESS: 200,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOTFOUND: 404,
    NOTACCEPTABLE: 406,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },
  ADMIN_CONSTANTS: {
    TWILIO_FROM_NO: "",
    TWILIO_SID: "",
    TWILIO_TOKEN: "",
    SENDGRID_FROM_EMAIL: "",
    SENDGRID_API_KEY: "",
  },
  COMPANY_SETTINGS: {
    TWO_FACTOR_AUTH_ENABLE: "TWO_FACTOR_AUTH_ENABLE",
  },
  statusConstants: {
    GENERAL_STATUS: {
      ACTIVE: 1,
      INACTIVE: 0,
    },
    USER_STATUS: {
      ACTIVE: 1,
      INACTIVE: 0,
      DELETED: 2,
    },
    COMPANY_STATUS: {
      ACTIVE: 1,
      INACTIVE: 0,
      DELETED: 2,
    },
  },
  ROLE: {
    USER: {
      ADMIN: "admin",
      USER: "user",
      AMBASSADOR: "ambassador",
      TRAVEL_SUPPLIER: "travel_supplier",
      PROPERTY_OWNER: "property_owner",
    },
  },
  valueConstants: {
    SETTING_TYPE: {
      ADMIN: "admin",
    },
    SETTING_SUPER_ADMIN_CONSTANT: "admin",
  },
  MESSAGES: {
    INTERNAL_SERVER_ERROR: "Internal server error",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    PERMISSION_DENIED: "Permission denied!",
    SOMETHING_WENT_WRONG: "Something went wrong",
    INVALID_TOKEN: "Invalid token",
    TOKEN_EXPIRED: "This token has been expired",
    FILTER_IS_REQUIRED: "Filter is required",
    INVALID_ID: "Invalid ID",
    USER: {
      EMAIL_IS_REQUIRED: "Email is required",
      REQUEST_USER_NOT_FOUND: "Request user not found",
      USER_NOT_FOUND: "User not found",
      PASSWORD_NOT_MATCH: "Password not matched",
      INVALID_PASSWORD: "Invalid password",
      YOU_CAN_NOT_USE_THIS_EMAIL: "You cannot use this email",
      USER_EXIST: "User already exist",
      USER_EXIST_WITH_EMAIL: "User already exists with this email",
      USER_EXIST_WITH_EMAIL_AND_INACTIVATED:
        "User already exists with this email and it's inactivated",
      INVALID_OTP: "Invalid OTP",
    },
    COMPANY: {
      COMPANY_NOT_FOUND: "Company not found",
      SAME_EMAIL_FOR_COMPANY_AND_ADMIN:
        "Email should be the same for company and admin",
    },
    SETTING: {
      SETTING_NOT_FOUND: "Setting not found",
    },
    TEMPLATE: {
      TEMPLATE_NOT_FOUND: "Template not found",
    },
    TWILIO: {
      TWILIO_ACCOUNT_NOT_FOUND: "Twilio Account not found",
    },
  },
  pagination: {
    PER_PAGE: Number(process.env.PER_PAGE),
  },
  ACCESS_API: {
    ACCESS_API_URL: 'https://amt-stage.accessdevelopment.com',
    ACCESS_TOKEN: 'caea7d71f7e98bfe2d55efdf6e72904dfaf9105bad13aab0c31a08ba6293bbf4',
    ORGANIZATION_ID: '204475',
    PROGRAM_ID: '204475'
  }
};
