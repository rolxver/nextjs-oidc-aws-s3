"use client";

import { useState } from "react";

export default function Home() {
  const [key, setKey] = useState("hello.txt");
  const [content, setContent] = useState("hello from vercel");
  const [log, setLog] = useState<string>("");

  const append = (m: string) => setLog((l) => l + m + "\n");

  async function uploadAndDownload() {
    setLog("");
    try {
      // 1. Get a pre-signed PUT URL
      const putRes = await fetch(
        `/api/s3-url?op=put&key=${encodeURIComponent(key)}`
      ).then((r) => r.json());
      append(`PUT URL: ${putRes.url.slice(0, 80)}...`);

      // 2. Upload directly to S3
      const up = await fetch(putRes.url, { method: "PUT", body: content });
      append(`Upload status: ${up.status}`);

      // 3. Get a pre-signed GET URL
      const getRes = await fetch(
        `/api/s3-url?op=get&key=${encodeURIComponent(key)}`
      ).then((r) => r.json());
      append(`GET URL: ${getRes.url.slice(0, 80)}...`);

      // 4. Download it back
      const dl = await fetch(getRes.url).then((r) => r.text());
      append(`Downloaded body: ${dl}`);
    } catch (e: any) {
      append(`ERROR: ${e.message}`);
    }
  }

  return (
    <main>
      <h1>S3 Pre-signed URL Test</h1>
      <p>
        Object key:{" "}
        <input value={key} onChange={(e) => setKey(e.target.value)} />
      </p>
      <p>
        Content:{" "}
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: 400 }}
        />
      </p>
      <button onClick={uploadAndDownload}>Upload + Download</button>
      <pre
        style={{
          background: "#f4f4f4",
          padding: 12,
          marginTop: 20,
          whiteSpace: "pre-wrap",
        }}
      >
        {log}
      </pre>
    </main>
  );
}
