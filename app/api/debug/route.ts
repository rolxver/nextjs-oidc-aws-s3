import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    AWS_REGION: process.env.AWS_REGION ?? null,
    S3_BUCKET: process.env.S3_BUCKET ?? null,
    AWS_ROLE_ARN: process.env.AWS_ROLE_ARN ?? null,
    VERCEL_OIDC_TOKEN_present: Boolean(process.env.VERCEL_OIDC_TOKEN),
    VERCEL_OIDC_TOKEN_length: process.env.VERCEL_OIDC_TOKEN?.length ?? 0,
  });
}
