import express from "express";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/process-video", (req, res) => {
  const inputFilePath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;

  if (!inputFilePath || !outputFilePath) {
    return res.status(400).send("Bad Request: Missing file path");
  }

  ffmpeg(inputFilePath)
    .outputOptions("-vf", "scale=-1:360")
    .on("end", () => {
      console.log("Processing finished successfully");
      res.status(200).send("Processing finished successfully");
    })
    .on("error", (err) => {
      console.log("Error occured: ", err);
      res.status(500).send("Error occured: " + err);
    })
    .save(outputFilePath);
});

app.listen(port, () => {
  console.log(`Video Processing service listening at http://localhost:${port}`);
});
