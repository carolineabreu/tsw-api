import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { countryRouter } from "./routes/country.routes.js";
import { userRouter } from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRouter);
app.use("/country", countryRouter);

app.listen(Number(process.env.PORT), () => {
  console.log(`Server up and running at port ${process.env.PORT}`);
});
