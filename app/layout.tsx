export const metadata = { title: "S3 OIDC Test" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 40 }}>{children}</body>
    </html>
  );
}
