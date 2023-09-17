import { NextFunction, Request, Response } from "express";
import prisma from "../db";
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from "../middleware/authMiddleware";
import { ZodError, z } from "zod";
import { CustomAPIError } from "../modules/errors";

const userSchema = z.object({
  username: z.string().min(2, "dude, a min of 2 chars").max(255),
  password: z.string().min(4, "dude, a min of 4 chars").max(255),
});

type User = z.infer<typeof userSchema>;

export async function createNewuser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. get username and password from request body
  const { username, password }: User = req.body;

  // check if user already exists. If so, throw error. They are trying to make a new account.
  const userExists = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (userExists) throw new CustomAPIError("User already exists.", 401);

  // 2. Create new user in database
  const hashedPassword = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  // 3. Create JWT token
  const token = generateToken({
    id: newUser.id,
    username: newUser.username,
  });

  // 4. return token in response
  return res.json({ token }).status(201);
}

export async function signIn(req: Request, res: Response) {
  // 1. get username and password from request body
  const { username, password }: Record<string, string> = req.body;

  // 2. find user in database
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) throw new CustomAPIError("User not found.", 401);

  // 3. compare passwords
  const passwordMatches = await comparePasswords(password, user.password);

  if (!passwordMatches) throw new CustomAPIError("Incorrect password.", 401);
  // 4. create token

  const token = generateToken({
    id: user.id,
    username: user.username,
  });

  // 5. return token in response
  return res.json({ token }).status(200);
}
