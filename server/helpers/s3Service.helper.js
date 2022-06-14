require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { S3 } = require("aws-sdk");

exports.s3Uploadv2 = async (file) => {
  const s3 = new S3();

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `inventoryImages/${uuidv4()}_${Date.now()}_${path.basename(file.originalname)}`,
    Body: file.buffer
  };

  return await s3.upload(params).promise();
};
