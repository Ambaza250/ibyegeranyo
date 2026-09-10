const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = "v22.0";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "250" + cleaned.slice(1);
  if (!cleaned.startsWith("250")) cleaned = "250" + cleaned;
  return cleaned;
}

export async function sendWhatsAppText({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  const phone = normalizePhone(to);

  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
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
        text: { preview_url: false, body },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp text error:", data);
    throw new Error(data.error?.message || "Failed to send WhatsApp text");
  }
  return data;
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "rw",
  components = [],
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: "body" | "header" | "button";
    parameters: Array<{ type: "text"; text: string }>;
  }>;
}) {
  const phone = normalizePhone(to);

  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("WhatsApp template error:", data);
    throw new Error(data.error?.message || "Failed to send WhatsApp template");
  }
  return data;
}
