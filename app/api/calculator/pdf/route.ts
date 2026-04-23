import { NextRequest, NextResponse } from "next/server";
import type { ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { CalculatorPdf } from "@/lib/calculator-pdf";

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

    const element = CalculatorPdf({
      description,
      smeta,
    }) as ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vibecraft-smeta.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Не удалось сгенерировать PDF" },
      { status: 500 },
    );
  }
}
