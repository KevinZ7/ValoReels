// 1. GCP storage interactions
// 2. Local storage interactions

import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { error } from "console";

const storage = new Storage();

const rawVideoBucketName = "vr-gcp-storage-raw-videos";
const processedVideoBucketName = "vr-gcp-storage-processed-videos";

const localRawVideoPath = "./raw_videos";
const localProcessedVideoPath = "./processed_videos";

/**Create local directories for raw and processed videos*/
export const setupDirectories = () => {
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
};

/**
 *
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video is converted.
 */
export const convertVideo = (
  rawVideoName: string,
  processedVideoName: string
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions("-vf", "scale=-1:360")
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve();
      })
      .on("error", (err) => {
        console.log("Error occured: ", err);
        reject(err);
      })
      .save(`${localProcessedVideoPath}/${processedVideoName}`);
  });
};

/**
 *
 * @param fileName - The name of the file to downlaod from GCP {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 *
 */
export const downloadRawVideo = async (fileName: string) => {
  await storage
    .bucket(rawVideoBucketName)
    .file(fileName)
    .download({ destination: `${localRawVideoPath}/${fileName}` });

  console.log(
    `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
  );
};

/**
 *
 * @param fileName - The name of the file to upload to GCP {@link processedVideoBucketName} bucket from the {@link localProcessedVideoPath} folder.
 */
export const uploadProcessedVideo = async (fileName: string) => {
  const bucket = storage.bucket(processedVideoBucketName);

  await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
    destination: fileName,
  });

  console.log(
    `File ${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
  );

  await bucket.file(fileName).makePublic();
};

/**
 *
 * @param fileName - The name of the file to delete from {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file is deleted.
 */
export const deleteRawVideo = (fileName: string): Promise<void> => {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
};

/**
 *
 * @param fileName - The name of the file to delete from {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the file is deleted.
 */
export const deleteProcessedVideo = (fileName: string): Promise<void> => {
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
};

/**
 *
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file is deleted.
 */
const deleteFile = (filePath: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file at path ${filePath}.`, err);
          reject(err);
        } else {
          console.log(`File ${filePath} deleted successfully.`);
          resolve();
        }
      });
    } else {
      console.log(`File ${filePath} does not exist.`);
      reject();
    }
  });
};

const ensureDirectoryExistence = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });

    console.log("Directory created: ", dirPath);
  }
};
