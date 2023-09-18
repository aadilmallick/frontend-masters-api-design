import { Router } from "express";
import { createNewuser, signIn } from "../handlers/userHandlers";
import { validate } from "../middleware/validationMiddleware";
import { z } from "zod";
import "express-async-errors";
// you have to import this into every file with async middleware or handlers.
// You can just do it in the router files

const router = Router();

const userSchema = z
  .object({
    username: z.string().min(2, "dude, a min of 2 chars").max(255),
    password: z.string().min(4, "dude, a min of 4 chars").max(255),
  })
  .required();

router.post("/new-user", validate(userSchema), createNewuser);
router.post("/login", validate(userSchema), signIn);

router.get("/", (req, res) => {
  res.send("hello world");
});

export default router;
