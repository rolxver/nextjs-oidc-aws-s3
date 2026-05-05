# nextjs-oidc-aws-s3

Minimal Next.js (App Router) app to test S3 access from Vercel using
**pre-signed URLs** and **OIDC federation** (no AWS user, no static keys).

## What it does

1. `GET /api/s3-url?op=put&key=foo.txt` → returns a pre-signed PUT URL.
2. Browser uploads directly to S3.
3. `GET /api/s3-url?op=get&key=foo.txt` → returns a pre-signed GET URL.
4. Browser downloads directly from S3.

The S3 bucket stays fully private (Block Public Access ON).

## AWS setup (one-time)

1. **Create an S3 bucket** (e.g. `my-vercel-test-bucket`) in some region. Keep
   Block Public Access ON.
2. **CORS on the bucket** (so the browser can PUT/GET directly):
   ```json
   [
     {
       "AllowedOrigins": ["https://<your-vercel-app>.vercel.app", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
3. **Create an OIDC Identity Provider** in IAM for Vercel
   (issuer + audience per Vercel's AWS integration docs).
4. **Create an IAM Role** trusted by that OIDC provider, with this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject"],
         "Resource": "arn:aws:s3:::my-vercel-test-bucket/*"
       }
     ]
   }
   ```
5. Note the role ARN.

## Vercel setup

Set these environment variables in the Vercel project:

| Variable          | Value                                        |
| ----------------- | -------------------------------------------- |
| `AWS_REGION`      | e.g. `eu-north-1`                            |
| `S3_BUCKET`       | bucket name                                  |
| `AWS_ROLE_ARN`    | the IAM role ARN created above               |

If you use Vercel's native AWS integration, `AWS_ROLE_ARN` and
`AWS_WEB_IDENTITY_TOKEN_FILE` are wired automatically.

## Local dev

For local testing, export temporary AWS credentials in your shell
(e.g. `aws sso login` then `aws configure export-credentials --format env`),
plus:

```bash
export AWS_REGION=eu-north-1
export S3_BUCKET=my-vercel-test-bucket
npm install
npm run dev
```

Then open http://localhost:3000 and click "Upload + Download".
