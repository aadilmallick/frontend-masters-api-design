import { NextFunction, Request, Response } from "express";
import prisma from "../db";
import { ZodError, z } from "zod";
import { CustomAPIError } from "../modules/errors";
import { AppRequest } from "../middleware/authMiddleware";
import { UPDATE_STATUS } from "@prisma/client";

export const makeUpdateSchema = z.object({
  title: z.string().min(4, "dude, a min of 4 chars").max(255),
  body: z.string().min(4, "dude, a min of 4 chars").max(255),
  status: z.enum([
    UPDATE_STATUS.ARCHIVED,
    UPDATE_STATUS.DEPRECATED,
    UPDATE_STATUS.IN_PROGRESS,
    UPDATE_STATUS.LIVE,
  ]),
});

export const patchUpdateSchema = z.object({
  title: z.string().min(4, "dude, a min of 4 chars").max(255).optional(),
  body: z.string().min(4, "dude, a min of 4 chars").max(255).optional(),
  status: z
    .enum([
      UPDATE_STATUS.ARCHIVED,
      UPDATE_STATUS.DEPRECATED,
      UPDATE_STATUS.IN_PROGRESS,
      UPDATE_STATUS.LIVE,
    ])
    .optional(),
});

type Payload = z.infer<typeof makeUpdateSchema>;

export async function createNewUpdate(
  req: AppRequest,
  res: Response,
  next: NextFunction
) {}
