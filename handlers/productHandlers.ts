import { NextFunction, Request, Response } from "express";
import prisma from "../db";
import { ZodError, z } from "zod";
import { CustomAPIError } from "../modules/errors";
import { AppRequest } from "../middleware/authMiddleware";

export const makeProductSchema = z.object({
  name: z.string().min(4, "dude, a min of 4 chars").max(255),
});

type Payload = z.infer<typeof makeProductSchema>;

export async function createNewProduct(
  req: AppRequest,
  res: Response,
  next: NextFunction
) {
  const { name }: Payload = req.body;

  const newProduct = await prisma.product.create({
    data: {
      name,
      belongsToId: req.user!.id,
    },
  });

  return res.json(newProduct).status(201);
}

export async function getProduct(
  req: AppRequest,
  res: Response,
  next: NextFunction
) {
  const id = req.params.id as string;
  const product = await prisma.product.findUnique({
    where: {
      id: id,
      belongsToId: req.user!.id,
    },
  });

  if (!product) {
    throw new CustomAPIError("No product found", 404);
  }

  return res.json({ data: product }).status(200);
}
