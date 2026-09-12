import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!; // the secret you will put in Meta

// GET = Meta verification handshake
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST = incoming messages & status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Always respond 200 quickly so Meta doesn't retry
    // Process the message in the background if needed

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Incoming message
    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from;          // phone number (e.g. 2507xxxxxxx)
      const text = message.text?.body;
      const type = message.type;

      console.log("WhatsApp message from", from, "→", text || type);

      // TODO: your business logic here
      // e.g. auto-reply, update payment status, notify admin, etc.
    }

    // Message status updates (delivered, read, failed…)
    if (value?.statuses) {
      console.log("Status update:", value.statuses[0]);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 }); // still return 200
  }
}
