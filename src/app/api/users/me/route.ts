import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { locales } from "@/i18n/config";

import type { NextRequest } from "next/server";

const themeValues = ["LIGHT", "DARK", "SYSTEM"] as const;

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  locale: z.enum(locales).optional(),
  theme: z.enum(themeValues).optional(),
});

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        locale: true,
        theme: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "ユーザーが見つかりません" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました",
        },
      },
      { status: 500 },
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        locale: true,
        theme: true,
        createdAt: true,
      },
    });

    if (parsed.data.locale) {
      const cookieStore = await cookies();
      cookieStore.set("locale", parsed.data.locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました",
        },
      },
      { status: 500 },
    );
  }
};
