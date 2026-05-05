import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromWebToken } from "@aws-sdk/credential-providers";
import { getVercelOidcToken } from "@vercel/functions/oidc";

export const runtime = "nodejs";

// On Vercel, getVercelOidcToken() returns a fresh OIDC JWT per request.
// We exchange it for temporary AWS creds via sts:AssumeRoleWithWebIdentity.
// Locally (no Vercel runtime) it throws, so we fall back to the default chain.
async function makeS3Client() {
  const region = process.env.AWS_REGION;
  const roleArn = process.env.AWS_ROLE_ARN;

  if (roleArn) {
    try {
      const token = await getVercelOidcToken();
      return new S3Client({
        region,
        credentials: fromWebToken({
          roleArn,
          webIdentityToken: token,
          roleSessionName: "vercel-nextjs-oidc-aws-s3",
        }),
      });
    } catch {
      // not running on Vercel (local dev) — fall through
    }
  }
  return new S3Client({ region });
}

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
    const s3 = await makeS3Client();
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
