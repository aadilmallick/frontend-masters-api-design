import { ValidationChain, body, validationResult } from "express-validator";
import { NextFunction, Response, Request } from "express";

export const validationDict = {
  validateUser: [body("username").isString(), body("password").isString()],
  validateProduct: [body("name").isString()],
};

export async function validateFields(validationChain: ValidationChain[]) {
  const validateInput = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(req);

    // perform error handling if found errors
    if (!errors.isEmpty()) {
      res.status(400);
      return res.json({ errors: errors.array() });
    }

    return next();
  };

  return [...validationChain, validateInput];
}
