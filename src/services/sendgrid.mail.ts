import sgMail from "@sendgrid/mail";
import { ISendEmailInterface } from "../interfaces/common";
import config from "../configs/constants";

class SendGridEmailService {
  private fromEmail: string;
  private apiKey: string;

  constructor(fromEmail: string, apiKey: string) {
    this.fromEmail = fromEmail;
    this.apiKey = apiKey;
  }

  async sendEmail(options: ISendEmailInterface) {
    try {
      const message: any = {
        from: this.fromEmail,
        ...options,
      };
      sgMail.setApiKey(this.apiKey);
      await sgMail.send(message);
      return {
        success: true,
        message: "Email sent!",
      };
    } catch (error: any) {
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export default SendGridEmailService;
