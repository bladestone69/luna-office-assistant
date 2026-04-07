import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminClientDetail } from "@/lib/admin-data";
import { isAdminApiRequest } from "@/lib/auth";
import { hashClientPassword } from "@/lib/client-password";

function deriveNameFromEmail(email: string) {
  const username = email.split("@")[0] ?? email;
  return username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getAdminClientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(detail.clientUsers);
  } catch (error) {
    console.error("[client users GET]", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminApiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim()
        : deriveNameFromEmail(email);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUsers = await db.select().from(clientUsers).where(eq(clientUsers.clientId, id));
    const [saved] = await db
      .insert(clientUsers)
      .values({
        clientId: id,
        name,
        email,
        passwordHash: hashClientPassword(password),
        role: existingUsers.length === 0 ? "admin" : "agent",
      })
      .returning();

    return NextResponse.json({
      id: saved.id,
      clientId: saved.clientId,
      name: saved.name,
      email: saved.email,
      role: saved.role === "admin" ? "owner" : "member",
    });
  } catch (error) {
    console.error("[client users POST]", error);
    return NextResponse.json({ error: "Failed to create login" }, { status: 500 });
  }
}
