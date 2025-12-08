class HttpException extends Error {
  public status: number;
  public message: string;
  public functionName: string;
  public hasError: boolean;
  constructor(statusCode: number, error: string, functionName: string) {
    super(error);
    this.status = statusCode || 500;
    // this.message = error || { message: "Internal Server Error" };
    this.message = error || "Internal Server Error";
    this.functionName = functionName;
    this.hasError = true;
  }
}

export default HttpException;
