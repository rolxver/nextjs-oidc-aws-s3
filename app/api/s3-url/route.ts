import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromWebToken } from "@aws-sdk/credential-providers";

export const runtime = "nodejs";

// On Vercel, VERCEL_OIDC_TOKEN is injected at runtime (OIDC Federation = ON).
// Exchange it for temporary AWS creds via sts:AssumeRoleWithWebIdentity.
// Locally, fall back to the default credential chain (~/.aws, env vars).
function makeS3Client() {
  const region = process.env.AWS_REGION;
  const roleArn = process.env.AWS_ROLE_ARN;
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;

  if (roleArn && oidcToken) {
    return new S3Client({
      region,
      credentials: fromWebToken({
        roleArn,
        webIdentityToken: oidcToken,
        roleSessionName: "vercel-nextjs-oidc-aws-s3",
      }),
    });
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
    const s3 = makeS3Client();
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
