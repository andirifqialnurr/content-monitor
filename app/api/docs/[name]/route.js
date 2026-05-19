import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const docs = {
  channel: "content-channel-plan.md",
  topics: "content-topic-bank.md",
  posts: "content-postingan-plan.md",
  videos: "content-short-video-plan.md",
  blog: "content-blog-medium-plan.md",
};

export async function GET(_request, { params }) {
  const { name: docName } = await params;
  const name = docs[docName];

  if (!name) {
    return new NextResponse("Document not found", { status: 404 });
  }

  const filePath = path.resolve(process.cwd(), "..", name);
  const content = await readFile(filePath, "utf8");

  return new NextResponse(content, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
