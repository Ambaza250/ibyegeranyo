import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Add ?phone=2507xxxxxxx" }, { status: 400 });
  }

  try {
    const result = await sendWhatsAppText({
      to: phone,
      body: "Muraho! 👋 This is a test message from Ibyegeranyo.com",
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
