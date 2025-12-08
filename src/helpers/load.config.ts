import config from "../configs/constants";
import { getSettingData } from "./db.helpers";

export async function loadConfigVariables() {
  try {
    const sendgridFromEmail = await getSettingData("sendgrid_from_email");
    const sendgridApiKey = await getSettingData("sendgrid_api_key");

    if (sendgridFromEmail) {
      config.ADMIN_CONSTANTS.SENDGRID_FROM_EMAIL = sendgridFromEmail;
    }
    if (sendgridApiKey) {
      config.ADMIN_CONSTANTS.SENDGRID_API_KEY = sendgridApiKey;
    }
    console.log("Configuration variables loaded successfully.");
  } catch (error) {
    console.error("Failed to load configuration variables:", error);
    process.exit(1);
  }
}
