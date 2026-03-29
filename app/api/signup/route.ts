import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { isHoneypotTriggered } from "@/lib/api";
import { getErnestEmail, sendEmail } from "@/lib/email";

// ─── POST /api/signup — Public lead capture (no auth required) ──────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      company,
      industry,
      message,
      preferredCallbackTime,
      consent,
    } = body;

    // Basic validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    // Honeypot check
    if (isHoneypotTriggered(body.website)) {
      // Silently accept to not tip off bots
      return NextResponse.json({ message: "Thank you! We'll be in touch soon." });
    }

    // Save lead to DB
    const [lead] = await db.insert(leads).values({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      topic: message?.trim() || "General inquiry",
      source: "web",
      status: "new",
      notes: [
        company ? `Company: ${company}` : null,
        industry ? `Industry: ${industry}` : null,
        preferredCallbackTime ? `Preferred callback: ${preferredCallbackTime}` : null,
      ].filter(Boolean).join("\n") || null,
    });

    // Notify Ernest
    try {
      await sendEmail({
        to: getErnestEmail(),
        subject: `New signup from ${name.trim()} — Aura Office`,
        text: [
          `New Aura Office signup — callback needed.`,
          ``,
          `Name: ${name.trim()}`,
          `Company: ${company?.trim() || "—"}`,
          `Industry: ${industry?.trim() || "—"}`,
          `Phone: ${phone.trim()}`,
          `Email: ${email.trim()}`,
          `Preferred callback: ${preferredCallbackTime?.trim() || "—"}`,
          `Message: ${message?.trim() || "—"}`,
          ``,
          `Lead ID: ${lead.id}`,
        ].join("\n"),
      });
    } catch (emailError) {
      // Non-fatal — lead is saved, notification failing shouldn't block the response
      console.error("[signup] Email notification failed:", emailError);
    }

    return NextResponse.json({
      message: "Thank you! We'll call you within one business day to get started.",
      leadId: lead.id,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[signup] Error:", err.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
