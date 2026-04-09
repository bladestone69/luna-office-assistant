import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { isHoneypotTriggered } from "@/lib/api";
import { getErnestEmail, sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      firstName,
      lastName,
      phone,
      email,
      company,
      industry,
      topic,
      products,
      message,
      preferredCallbackTime,
      consent,
    } = body;

    const fullName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : [firstName, lastName]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean)
            .join(" ");
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const resolvedTopic =
      (typeof topic === "string" && topic.trim()) ||
      (typeof products === "string" && products.trim()) ||
      "Pre-registration";
    const consentGiven = consent === undefined ? true : Boolean(consent);

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!consentGiven) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    if (isHoneypotTriggered(body.website)) {
      return NextResponse.json({ message: "Thank you! We'll be in touch soon." });
    }

    const [lead] = await db
      .insert(leads)
      .values({
        name: fullName,
        phone: normalizedPhone,
        email: normalizedEmail,
        topic: resolvedTopic,
        source: "web",
        status: "new",
        notes:
          [
            company ? `Company: ${String(company).trim()}` : null,
            industry ? `Industry: ${String(industry).trim()}` : null,
            preferredCallbackTime ? `Preferred callback: ${String(preferredCallbackTime).trim()}` : null,
            message ? `Message: ${String(message).trim()}` : null,
          ]
            .filter(Boolean)
            .join("\n") || null,
      })
      .returning();

    try {
      await sendEmail({
        to: getErnestEmail(),
        subject: `New signup from ${fullName} - Aura Office`,
        text: [
          "New Aura Office signup - callback needed.",
          "",
          `Name: ${fullName}`,
          `Company: ${typeof company === "string" && company.trim() ? company.trim() : "-"}`,
          `Industry: ${typeof industry === "string" && industry.trim() ? industry.trim() : "-"}`,
          `Product interest: ${resolvedTopic}`,
          `Phone: ${normalizedPhone}`,
          `Email: ${normalizedEmail}`,
          `Preferred callback: ${typeof preferredCallbackTime === "string" && preferredCallbackTime.trim() ? preferredCallbackTime.trim() : "-"}`,
          `Message: ${typeof message === "string" && message.trim() ? message.trim() : "-"}`,
          "",
          `Lead ID: ${lead.id}`,
        ].join("\n"),
      });
    } catch (emailError) {
      console.error("[signup] Email notification failed:", emailError);
    }

    return NextResponse.json(
      {
        message: "Thank you! We'll call you within one business day to get started.",
        leadId: lead.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[signup] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
