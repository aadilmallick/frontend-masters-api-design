import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { fromZodError } from "zod-validation-error";
import * as z from "zod";
import { CustomAPIError } from "../modules/errors";

export function validate<T extends z.ZodTypeAny>(schema: T) {
  console.log("in validation");
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    try {
      schema.parse(req.body);
      return next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        const validationError = fromZodError(e);
        throw new CustomAPIError(validationError.message, 400);
      }
    }
  };
}
