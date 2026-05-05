"use client";

import { useState } from "react";

export default function Home() {
  const [key, setKey] = useState("hello.txt");
  const [content, setContent] = useState("hello from vercel");
  const [log, setLog] = useState<string>("");

  const append = (m: string) => setLog((l) => l + m + "\n");

  async function getSignedUrl(op: "put" | "get") {
    const res = await fetch(
      `/api/s3-url?op=${op}&key=${encodeURIComponent(key)}`
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      throw new Error(
        `sign ${op} failed: HTTP ${res.status} ${JSON.stringify(body)}`
      );
    }
    return body.url as string;
  }

  async function uploadAndDownload() {
    setLog("");
    try {
      const putUrl = await getSignedUrl("put");
      append(`PUT URL: ${putUrl.slice(0, 80)}...`);

      const up = await fetch(putUrl, { method: "PUT", body: content });
      append(`Upload status: ${up.status}`);
      if (!up.ok) throw new Error(`upload failed: ${await up.text()}`);

      const getUrl = await getSignedUrl("get");
      append(`GET URL: ${getUrl.slice(0, 80)}...`);

      const dl = await fetch(getUrl);
      const text = await dl.text();
      append(`Download status: ${dl.status}`);
      append(`Downloaded body: ${text}`);
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
