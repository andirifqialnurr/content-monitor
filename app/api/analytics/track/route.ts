import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { trackPublicAnalyticsEvent } from "@/server/modules/analytics/analytics.service";
import { trackPublicAnalyticsInputSchema } from "@/server/modules/analytics/analytics.schema";

const visitorCookieName = "cm_visitor_id";

export async function POST(request: NextRequest) {
  const visitorId = request.cookies.get(visitorCookieName)?.value ?? randomUUID();

  try {
    const input = trackPublicAnalyticsInputSchema.parse(await request.json());

    await trackPublicAnalyticsEvent(prisma, input, {
      visitorId,
      ipHash: hashIpAddress(getIpAddress(request)),
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(visitorCookieName, visitorId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}

function getIpAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedAddress = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedAddress || request.headers.get("x-real-ip");
}

function hashIpAddress(ipAddress: string | null | undefined) {
  if (!ipAddress) {
    return null;
  }

  const salt = process.env.NEXTAUTH_SECRET ?? "content-monitor";

  return createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex");
}

function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ message: "Payload tracking tidak valid." }, { status: 400 });
  }

  if (error instanceof TRPCError) {
    return NextResponse.json(
      { message: error.message },
      {
        status: trpcCodeToHttpStatus(error.code),
      },
    );
  }

  return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
}

function trpcCodeToHttpStatus(code: TRPCError["code"]) {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    default:
      return 500;
  }
}
