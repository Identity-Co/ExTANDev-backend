import axios from "axios";
import qs from "qs";
class TwilioService {
  private username: string;
  private password: string;
  private fromNumber: string;
  private auth: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.username = accountSid;
    this.password = authToken;
    this.auth = Buffer.from(`${this.username}:${this.password}`).toString(
      "base64"
    );
    this.fromNumber = fromNumber.startsWith("+")
      ? fromNumber
      : `+${fromNumber}`;
  }

  async sendSms(to: string, message: string) {
    try {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${this.auth}`,
      };
      const data = qs.stringify({
        To: to,
        Body: message,
        From: this.fromNumber,
      });
      const config = {
        method: "post",
        url: `https://api.twilio.com/2010-04-01/Accounts/${this.username}/Messages.json`,
        headers: headers,
        data: data,
      };
      const response = await axios.request(config);
      console.log("Message sent successfully:", response?.data?.account_sid);
      return {
        success: true,
        message: "Msg sent!",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Twilio API Error:",
          error.response?.data || error.message
        );
      } else if (error instanceof Error) {
        console.error("Unexpected Error:", error.message);
      } else {
        console.error("Unknown Error:", String(error));
      }
      return {
        success: false,
        message: "Failed to send msg",
      };
    }
  }
}

export default TwilioService;
