import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  confirmPayment,
  rejectPayment,
  getPaymentById,
  getUserById,
} from "@/lib/db";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { PLANS } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, action } = body;

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: "Payment ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "confirm") {
      const result = await confirmPayment(paymentId, admin.id);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to confirm payment" },
          { status: 400 }
        );
      }

      // ===== SEND WHATSAPP TEMPLATE =====
      try {
        const payment = await getPaymentById(paymentId);
        if (payment) {
          const user = await getUserById(payment.userId);
          const plan = PLANS.find((p) => p.id === payment.plan);
          const planName = plan?.name || payment.plan;
          const expiresAt = payment.expiresAt
            ? new Date(payment.expiresAt).toLocaleDateString("rw-RW")
            : "—";

          await sendWhatsAppTemplate({
            to: payment.phone,
            templateName: "payment_approved", // exact name of your template
            languageCode: "rw",               // change to "en" if you chose English
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: user?.fullName || "umukiriya" },
                  { type: "text", text: planName },
                  { type: "text", text: expiresAt },
                ],
              },
            ],
          });
        }
      } catch (waError) {
        // Don't fail the approval if WhatsApp fails
        console.error("WhatsApp notification failed:", waError);
      }
      // ==================================

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
      });
    }

    if (action === "reject") {
      const result = await rejectPayment(paymentId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to reject payment" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Payment rejected",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
