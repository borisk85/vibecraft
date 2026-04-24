import { NextRequest, NextResponse } from "next/server";
import { generateCalculatorPdfBuffer } from "@/lib/calculator-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const smeta = typeof body?.smeta === "string" ? body.smeta.trim() : "";

    if (!description || !smeta) {
      return NextResponse.json(
        { error: "Нужны описание и смета" },
        { status: 400 },
      );
    }

    const pdfBuffer = await generateCalculatorPdfBuffer({
      description,
      smeta,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vibecraft-smeta.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("PDF generation error:", message);
    console.error("Stack:", stack);
    return NextResponse.json(
      { error: "Не удалось сгенерировать PDF", detail: message },
      { status: 500 },
    );
  }
}
