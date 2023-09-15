import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { setupDirectories } from "./storage";

setupDirectories();
const app = express();
app.use(express.json());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/process-video", (req, res) => {});

app.listen(port, () => {
  console.log(`Video Processing service listening at http://localhost:${port}`);
});
