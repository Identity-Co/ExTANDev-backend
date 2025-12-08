import constants from "../configs/constants";
import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  status?: number;
  hasError?: boolean;
  functionName?: string;
}

const fatalCodes = [
  constants.statusCode.INTERNAL_SERVER_ERROR,
  constants.statusCode.GATEWAY_TIMEOUT,
  constants.statusCode.SERVICE_UNAVAILABLE,
  constants.statusCode.FORBIDDEN,
  constants.statusCode.UNAUTHORIZED,
  constants.statusCode.BAD_REQUEST,
  constants.statusCode.NOTFOUND,
  constants.statusCode.NOTACCEPTABLE,
  constants.statusCode.CONFLICT,
];

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const functionName = err.functionName || "";
    const errMsg = err.message || "Internal Server Error";
    const errStatus = err.status || constants.statusCode.INTERNAL_SERVER_ERROR;
    const hasError = err.hasError || true;

    if (fatalCodes.includes(errStatus)) {
      if (errStatus === constants.statusCode.INTERNAL_SERVER_ERROR) {
        console.log(errMsg, {
          tags: {
            function: functionName,
          },
          metadata: {
            statusCode: errStatus || constants.statusCode.INTERNAL_SERVER_ERROR,
            stack: err.stack || "Not Available",
          },
          level: "error",
        });
      }
    } else {
      console.log(errMsg, {
        tags: {
          function: functionName,
        },
        metadata: {
          statusCode: errStatus || constants.statusCode.INTERNAL_SERVER_ERROR,
          stack: err.stack || "Not Available",
        },
        level: "error",
      });
    }
    console.log("error:-", errMsg);

    res.status(errStatus).json({
      success: false,
      errors: {
        statusCode: errStatus,
        message: errMsg,
        hasError,
        functionName,
      },
    });
  } catch (err) {
    console.error(err);
  }
};
