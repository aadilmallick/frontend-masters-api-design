import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import "express-async-errors";
import { CustomAPIError } from "../modules/errors";
dotenv.config();

/***********
 *
 *  JWT
 *
 *
 */

interface UserPayload {
  id: string;
  username: string;
}

export function generateToken<T extends object = UserPayload>(user: T) {
  return jwt.sign(user, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

export function decodeToken<T extends object = UserPayload>(token: string): T {
  const payload = jwt.verify(token, process.env.JWT_SECRET as string);
  return JSON.parse(JSON.stringify(payload)) as T;
}

export interface AppRequest extends Request {
  user?: UserPayload;
}

export async function protect(
  req: AppRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  // check existence of bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // get the token from "Bearer <token>" syntax
    token = req.headers.authorization.split(" ")[1];

    try {
      // decode user from jwt
      const user = await decodeToken(token);
      if (!user)
        throw new CustomAPIError("Not authorized. Incorrect token.", 401);

      // set req.user variable for next middleware
      req.user = user;
      next();
    } catch (e) {
      throw new CustomAPIError("Not authorized.", 401);
    }
  }

  if (!token) {
    throw new CustomAPIError("Not authorized.", 401);
  }
}

/***********
 *
 *  Passwords
 *
 *
 */

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePasswords = (
  plainTextPassword: string,
  hashedPassword: string
) => bcrypt.compare(plainTextPassword, hashedPassword);
