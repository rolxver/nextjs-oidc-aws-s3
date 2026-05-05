import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

// Default credential chain picks up Vercel's OIDC web-identity token
// (AWS_ROLE_ARN + AWS_WEB_IDENTITY_TOKEN_FILE) automatically.
const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const op = searchParams.get("op") ?? "get";

  if (!key) {
    return NextResponse.json({ error: "missing key" }, { status: 400 });
  }
  if (!process.env.S3_BUCKET) {
    return NextResponse.json({ error: "S3_BUCKET not set" }, { status: 500 });
  }

  try {
    const command =
      op === "put"
        ? new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
        : new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "sign failed" },
      { status: 500 }
    );
  }
}
