import { Router } from "express";
import {
  createNewProduct,
  makeProductSchema,
} from "../handlers/productHandlers";
import { validate } from "../middleware/validationMiddleware";
import "express-async-errors";

const router = Router();
/**
 * Update
 */

router.get("/update", (req, res) => {});

router.get("/update/:id", (req, res) => {});

router.post("/update", (req, res) => {});

router.put("/update/:id", (req, res) => {});

router.delete("/update/:id", (req, res) => {});

export default router;
