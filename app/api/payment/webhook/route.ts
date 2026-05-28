import { NextRequest, NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { handlePaymentWebhook } from "@/server/modules/payments/payments.service";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const order = await handlePaymentWebhook(prisma, payload);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
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
