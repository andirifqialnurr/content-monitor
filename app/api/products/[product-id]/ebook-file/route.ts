import { NextRequest, NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { getEbookFileAccess, uploadEbookFile } from "@/server/modules/products/product-files.service";

type RouteContext = {
  params: Promise<{
    "product-id": string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getRequiredUser();
    const { "product-id": productId } = await params;
    const access = await getEbookFileAccess(prisma, user.id, productId);

    if (access.kind === "redirect") {
      return NextResponse.redirect(new URL(access.url, request.url));
    }

    const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

    const body = new Blob([access.file.content], { type: access.file.mimeType });

    return new NextResponse(body, {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `${disposition}; filename="${access.file.fileName}"`,
        "content-length": String(access.file.size),
        "content-type": access.file.mimeType,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getRequiredUser();
    const { "product-id": productId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File e-book wajib dikirim.",
      });
    }

    const uploadedFile = await uploadEbookFile(prisma, user.id, productId, file);

    return NextResponse.json(uploadedFile);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function getRequiredUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Login dibutuhkan untuk mengakses file produk.",
    });
  }

  return user;
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
