import { NextRequest, NextResponse } from "next/server";

import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

export const runtime = "nodejs";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function POST(
  req: NextRequest
) {

  try {

    const data = await req.formData();

    const file =
      data.get("file") as File;

    if (!file) {

      return NextResponse.json(
        {
          error: "No file uploaded",
        },
        { status: 400 }
      );
    }

    const bucket =
      process.env.S3_BUCKET_NAME ??
      process.env.AWS_BUCKET_NAME;
    const region = getRequiredEnv("AWS_REGION");
    const accessKeyId =
      getRequiredEnv("AWS_ACCESS_KEY_ID");
    const secretAccessKey =
      getRequiredEnv("AWS_SECRET_ACCESS_KEY");

    console.log("Bucket:", bucket);
    console.log("Region:", region);

    if (!bucket) {
      throw new Error(
        "Missing required environment variable: S3_BUCKET_NAME"
      );
    }

    if (!file.type) {
      throw new Error("Uploaded file is missing ContentType");
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    if (!buffer.length) {
      throw new Error("Uploaded file body is empty");
    }

    const fileName = `${Date.now()}-${file.name}`;
    const key = `attendance/${fileName}`;
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      fileUrl,
    });

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed",
      },
      {
        status: 500,
      }
    );
  }
}
