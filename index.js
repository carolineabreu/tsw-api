import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { commentRouter } from "./routes/comment.routes.js";
import { countryRouter } from "./routes/country.routes.js";
import { reviewRouter } from "./routes/review.routes.js";
import { userRouter } from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRouter);
app.use("/country", countryRouter);
app.use("/review", reviewRouter);
app.use("/comment", commentRouter);

app.listen(Number(process.env.PORT), () => {
  console.log(`Server up and running at port ${process.env.PORT}`);
});
