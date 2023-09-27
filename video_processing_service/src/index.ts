import express from "express";
import {
  convertVideo,
  deleteProcessedVideo,
  deleteRawVideo,
  downloadRawVideo,
  setupDirectories,
  uploadProcessedVideo,
} from "./storage";

setupDirectories();
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/process-video", async (req, res) => {
  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;
  try {
    const message = Buffer.from(req.body.message.data, "base64").toString(
      "utf8"
    );
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error("Invalid message payload received.");
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send("Bad Request: missing filename.");
  }

  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`;

  // Download raw video from cloud storage
  try {
    await downloadRawVideo(inputFileName);
  } catch (err) {
    Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
    ]);
    console.error(err);
    return res
      .status(500)
      .send(
        "Internal Server Error: Downloading raw video from cloud storage failed."
      );
  }

  // Convert video to 360p
  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (err) {
    Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
    ]);
    console.error(err);
    return res
      .status(500)
      .send("Internal Server Error: video conversion failed.");
  }

  //Upload the processed video to cloud storage
  await uploadProcessedVideo(outputFileName);

  //Clean up
  Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName),
  ]);

  return res.status(200).send("Processing finished successfully");
});

app.listen(port, () => {
  console.log(`Video Processing service listening at http://localhost:${port}`);
});
