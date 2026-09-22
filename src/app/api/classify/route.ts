import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";

const INFERENCE_URL = process.env.INFERENCE_SERVICE_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
  await writeFile(uploadPath, bytes);
  const imageUrl = `/uploads/${filename}`;

  try {
    const proxyForm = new FormData();
    proxyForm.set("file", new Blob([bytes], { type: file.type }), file.name);

    const res = await fetch(`${INFERENCE_URL}/predict`, {
      method: "POST",
      body: proxyForm,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Inference service returned ${res.status}`);
    }

    const result = await res.json();
    return NextResponse.json({
      success: true,
      source: "model",
      imageUrl,
      degree: result.degree,
      thickness: result.thickness,
      confidence: result.confidence,
      probabilities: result.probabilities,
    });
  } catch {
    // Inference service isn't running or unreachable — caller falls back to mock classification.
    return NextResponse.json({
      success: false,
      source: "unavailable",
      imageUrl,
      error: "Inference service unavailable.",
    });
  }
}
