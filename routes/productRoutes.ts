import { Router } from "express";
import {
  createNewProduct,
  makeProductSchema,
  getProduct,
} from "../handlers/productHandlers";
import { validate } from "../middleware/validationMiddleware";
import "express-async-errors";

const router = Router();
/**
 * Product
 */
router.get("/product", (req, res) => {
  res.json({ message: "product" });
});

router.get("/product/:id", getProduct);

router.post("/product", validate(makeProductSchema), createNewProduct);

router.put("/product/:id", (req, res) => {});

router.delete("/product/:id", (req, res) => {});

export default router;
