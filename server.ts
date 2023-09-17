import express from "express";
import productRoutes from "./routes/productRoutes";
import updatePointRoutes from "./routes/updatePointRoutes";
import updateRoutes from "./routes/updateRoutes";
import userRoutes from "./routes/userRoutes";
import { protect } from "./middleware/authMiddleware";
import "express-async-errors";
import { errorHandler } from "./modules/errors";
import config from "./config";

const app = express();

// explain these
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRoutes);
app.use("/api", protect, productRoutes);
app.use("/api", protect, updateRoutes);
app.use("/api", protect, updatePointRoutes);

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello World!");
});

// explain this
app.use(errorHandler);

app.listen(config.port, () =>
  console.log(
    `Server running on port ${config.port} at http://localhost:${config.port}`
  )
);
