import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());




app.listen(Number(process.env.PORT), () => {
  console.log(`Server up and running at port ${process.env.PORT}`);
});
