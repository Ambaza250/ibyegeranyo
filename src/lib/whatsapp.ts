const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = "v22.0"; // or the latest version Meta shows you

interface SendTextOptions {
  to: string;          // phone number, e.g. "250781234567"
  body: string;
}

export async function sendWhatsAppText({ to, body }: SendTextOptions) {
  // Normalize Rwandan numbers
  let phone = to.replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "250" + phone.slice(1);
  if (!phone.startsWith("250")) phone = "250" + phone;

  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp send error:", data);
    throw new Error(data.error?.message || "Failed to send WhatsApp message");
  }

  return data;
}
