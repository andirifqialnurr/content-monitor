import "dotenv/config";
import { spawn } from "node:child_process";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const port = Number(process.env.SMOKE_PORT ?? 4110);
const baseUrl = (process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/+$/, "");
const shouldStartServer = process.env.SMOKE_START_SERVER !== "false";
const smokeEmail = process.env.SMOKE_EMAIL ?? "smoke@content-monitor.local";
const smokePassword = process.env.SMOKE_PASSWORD ?? "SmokePassword123!";
const smokeResetPassword = process.env.SMOKE_RESET_PASSWORD ?? "SmokePassword123!!";
const databaseUrl = process.env.DATABASE_URL;

class CookieJar {
  cookies = new Map();

  capture(headers) {
    const setCookies = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : fallbackSetCookie(headers);

    for (const value of setCookies) {
      const [cookie] = value.split(";");
      const separator = cookie.indexOf("=");

      if (separator > -1) {
        this.cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1));
      }
    }
  }

  headers() {
    if (!this.cookies.size) {
      return {};
    }

    const cookie = Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    return { cookie };
  }
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

if (!databaseUrl.startsWith("file:") && process.env.SMOKE_ALLOW_DB_WRITE !== "true") {
  throw new Error("Refusing to write smoke user unless DATABASE_URL is local file: or SMOKE_ALLOW_DB_WRITE=true.");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

let serverProcess = null;

try {
  const smokeUser = await ensureSmokeUser();

  if (shouldStartServer) {
    serverProcess = startServer();
  }

  await waitForServer();
  await assertGuestRedirect();
  await assertPublicTrpc();

  const session = await login(smokeEmail, smokePassword);
  const protectedClient = createClient(session);
  const profile = await protectedClient.account.getProfile.query();

  if (profile.email !== smokeEmail) {
    throw new Error(`Unexpected profile email: ${profile.email}`);
  }

  await protectedClient.account.updateProfile.mutate({
    name: profile.name ?? "Smoke User",
    username: profile.username,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    timezone: profile.timezone ?? "Asia/Jakarta",
  });
  await protectedClient.payments.dashboard.query();

  const resetToken = await createPasswordResetToken(smokeUser.id);
  const publicClient = createClient();
  await publicClient.auth.forgotPassword.mutate({ email: "missing-smoke@content-monitor.local" });
  await publicClient.auth.resetPassword.mutate({
    token: resetToken,
    password: smokeResetPassword,
  });

  const resetSession = await login(smokeEmail, smokeResetPassword);
  const resetClient = createClient(resetSession);
  await resetClient.account.changePassword.mutate({
    currentPassword: smokeResetPassword,
    newPassword: smokePassword,
  });

  console.log("Authenticated smoke test passed.");
} finally {
  await prisma.$disconnect();

  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
}

async function ensureSmokeUser() {
  return prisma.user.upsert({
    where: { email: smokeEmail },
    update: {
      name: "Smoke User",
      username: "smoke-user",
      status: "ACTIVE",
      passwordHash: hashPassword(smokePassword),
    },
    create: {
      name: "Smoke User",
      email: smokeEmail,
      username: "smoke-user",
      role: "USER",
      status: "ACTIVE",
      passwordHash: hashPassword(smokePassword),
    },
  });
}

function startServer() {
  const nextBin = ".\\node_modules\\next\\dist\\bin\\next";
  const child = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXTAUTH_URL: baseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stderr.on("data", (chunk) => {
    const message = chunk.toString();
    if (!message.includes("Next.js")) {
      process.stderr.write(message);
    }
  });

  return child;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is still booting.
    }

    await delay(500);
  }

  throw new Error(`Server did not become ready at ${baseUrl}.`);
}

async function assertGuestRedirect() {
  const response = await fetch(`${baseUrl}/account`, {
    redirect: "manual",
  });

  if (response.status !== 307 && response.status !== 302) {
    throw new Error(`Expected guest /account redirect, got ${response.status}.`);
  }
}

async function assertPublicTrpc() {
  const client = createClient();
  const health = await client.health.status.query();

  if (health.status !== "ok") {
    throw new Error(`Unexpected health status: ${health.status}`);
  }
}

async function login(email, password) {
  const jar = new CookieJar();
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: jar.headers(),
  });
  jar.capture(csrfResponse.headers);

  const csrf = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/events`,
  });
  const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials?json=true`, {
    method: "POST",
    headers: {
      ...jar.headers(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    redirect: "manual",
  });
  jar.capture(loginResponse.headers);

  if (!loginResponse.ok && loginResponse.status !== 302) {
    throw new Error(`Login failed with status ${loginResponse.status}.`);
  }

  const accountResponse = await fetch(`${baseUrl}/account`, {
    headers: jar.headers(),
    redirect: "manual",
  });

  if (!accountResponse.ok) {
    throw new Error(`Authenticated /account check failed with status ${accountResponse.status}.`);
  }

  return jar;
}

function createClient(jar) {
  return createTRPCProxyClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers() {
          return jar?.headers() ?? {};
        },
      }),
    ],
  });
}

async function createPasswordResetToken(userId) {
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return token;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function fallbackSetCookie(headers) {
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
