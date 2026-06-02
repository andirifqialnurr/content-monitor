import "dotenv/config";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { chromium } from "playwright";

const port = Number(process.env.UI_TEST_PORT ?? 4120);
const baseUrl = (process.env.UI_TEST_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/+$/, "");
const shouldStartServer = process.env.UI_TEST_START_SERVER !== "false";
const headed = process.env.UI_TEST_HEADED === "true";
const databaseUrl = process.env.DATABASE_URL;
const runId = Date.now().toString(36);
const artifactPrefix = `QA UI ${runId}`;

const users = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@content-monitor.local",
    password: process.env.ADMIN_PASSWORD ?? "AdminPassword123!",
  },
  creator: {
    email: "creator@content-monitor.local",
    password: "CreatorPassword123!",
  },
  buyer: {
    email: "buyer@content-monitor.local",
    password: "BuyerPassword123!",
  },
  inactive: {
    email: "inactive@content-monitor.local",
    password: "InactivePassword123!",
  },
};

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

if (!databaseUrl.startsWith("file:") && process.env.UI_TEST_ALLOW_DB_WRITE !== "true") {
  throw new Error("Refusing UI test cleanup unless DATABASE_URL is local file: or UI_TEST_ALLOW_DB_WRITE=true.");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

let serverProcess = null;
let browser = null;
const phaseResults = [];

try {
  await cleanupArtifacts();

  if (shouldStartServer) {
    serverProcess = startServer();
  }

  await waitForServer();
  browser = await chromium.launch({ headless: !headed });

  await runPhase("Progress 1 - Auth, Account, Public Route", async () => {
    await authAccountAndPublicRoutes();
  });
  await runPhase("Progress 2 - Events dan Bank Konten", async () => {
    await eventsAndContentBank();
  });
  await runPhase("Progress 3 - Produk, Course, Appearance, Payment, Learner, Statistics", async () => {
    await creatorCommerceLearnerAndAnalytics();
  });
  await runPhase("Progress 4 - Admin Menu, Filter, Moderation, Settings", async () => {
    await adminArea();
  });

  console.log("\nUI regression passed.");
  for (const result of phaseResults) {
    console.log(`- ${result.name}: ${result.elapsedMs}ms`);
  }
} finally {
  await browser?.close().catch(() => null);
  await cleanupArtifacts().catch((error) => {
    console.error("UI test cleanup failed:", error);
  });
  await prisma.$disconnect().catch(() => null);

  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
}

async function authAccountAndPublicRoutes() {
  await withTrackedPage("guest", async (page, tracker) => {
    await goto(page, "/account");
    await expectUrlContains(page, "/login", "guest account redirect");

    await goto(page, "/login");
    await page.getByPlaceholder("Email").fill(users.inactive.email);
    await page.getByPlaceholder("Password").fill(users.inactive.password);
    await page.getByRole("button", { name: "Login" }).click();
    await expectText(page, "Email atau password tidak valid.", "inactive user login rejection");
    clearExpectedUiErrors(tracker, (error) => error.includes("401 (Unauthorized)"));

    await assertNoUiErrors(tracker);
  });

  await withLoggedInPage("creator", users.creator, async (page, tracker) => {
    await goto(page, "/account");
    await expectText(page, "Account", "account page");
    await page.locator('textarea[name="bio"]').fill(`Bio update ${artifactPrefix}`);
    await page.locator('input[name="timezone"]').fill("Asia/Jakarta");
    await page.getByRole("button", { name: "Simpan profile" }).click();
    await expectText(page, "Profile tersimpan.", "profile save feedback");

    await page.locator('input[name="currentPassword"]').fill(users.creator.password);
    await page.locator('input[name="newPassword"]').fill("CreatorPassword123!!");
    await page.getByRole("button", { name: "Ganti password" }).click();
    await expectText(page, "Password diperbarui.", "password changed feedback");
    await page.locator('input[name="currentPassword"]').fill("CreatorPassword123!!");
    await page.locator('input[name="newPassword"]').fill(users.creator.password);
    await page.getByRole("button", { name: "Ganti password" }).click();
    await expectText(page, "Password diperbarui.", "password restored feedback");

    await assertNoUiErrors(tracker);
  });

  await withTrackedPage("public", async (page, tracker) => {
    await goto(page, "/creator-demo");
    await expectText(page, "Rina Creator", "published creator page");
    await expectText(page, "Creator Launch Playbook", "public product block");

    await goto(page, "/creator-demo/product/creator-launch-playbook");
    await expectText(page, "Creator Launch Playbook", "public e-book page");
    await expectText(page, "Beli e-book", "public e-book checkout CTA");

    await goto(page, "/creator-demo/course/content-system-course");
    await expectText(page, "Content System Course", "public course page");
    await expectText(page, "Materi Course", "public course curriculum");

    await goto(page, "/creator-demo/content/checklist-launch-produk-digital");
    await expectText(page, "Checklist launch produk digital tanpa tim besar", "public content page");

    await assertNoUiErrors(tracker);
  });
}

async function eventsAndContentBank() {
  await withLoggedInPage("creator", users.creator, async (page, tracker) => {
    await goto(page, "/events");
    await expectText(page, "Events", "events dashboard");

    for (const label of ["Week", "3 Days", "Day", "Year", "Schedule", "Month"]) {
      await page.getByRole("tab", { name: label, exact: true }).click();
      await page.waitForTimeout(150);
    }

    await page.getByLabel("Filter format konten").selectOption("VIDEO_SHORT");
    await page.getByLabel("Filter status konten").selectOption("SCHEDULED");
    await page.waitForLoadState("networkidle").catch(() => null);

    const eventTitle = `${artifactPrefix} Event`;
    await page.locator(".fc-daygrid-day-frame").nth(10).click({ position: { x: 20, y: 20 } });
    const dialog = page.locator(".fixed.inset-0").filter({ hasText: "Tambah Event Konten" });
    await expectLocator(dialog, "create event dialog");
    await dialog.locator("select").first().selectOption("VIDEO_SHORT");
    await dialog.locator("select").nth(1).selectOption("SCHEDULED");
    await dialog.locator("input").nth(0).fill(eventTitle);
    await dialog.locator("textarea").fill("Event konten dari UI regression.");
    await dialog.getByRole("button", { name: "Tambah" }).click();
    await expectText(page, eventTitle, "created calendar event");
    await page.getByText(eventTitle).first().click();
    const editDialog = page.locator(".fixed.inset-0").filter({ hasText: "Edit Event Konten" });
    await expectLocator(editDialog, "edit event dialog");
    await editDialog.getByRole("button", { name: "Hapus" }).click();
    await page.getByText(eventTitle).waitFor({ state: "hidden", timeout: 10000 }).catch(() => null);

    const banks = [
      ["/bank-konten/video-short", "Video Short"],
      ["/bank-konten/carousel-post", "Carousel Post"],
      ["/bank-konten/blog", "Blog"],
      ["/bank-konten/long-video", "Long Video"],
    ];

    for (const [path, label] of banks) {
      await testContentBankCrud(page, path, label);
    }

    await assertNoUiErrors(tracker);
  });
}

async function creatorCommerceLearnerAndAnalytics() {
  await withLoggedInPage("creator", users.creator, async (page, tracker) => {
    await testProductCrud(page, "e-book");
    await testCourseCrud(page);
    await testAppearance(page);

    await goto(page, "/payment");
    await expectText(page, "Payment", "payment dashboard");
    await expectText(page, "Revenue paid", "sales summary");
    await expectText(page, "Content System Course", "sales order list");
    await page.getByRole("tab", { name: "Pembelian" }).click();
    await expectText(page, "Partner Analytics Bootcamp", "purchase order list");
    const purchaseRow = page.locator("article").filter({ hasText: "Partner Analytics Bootcamp" }).first();
    await purchaseRow.getByRole("link", { name: "Detail" }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/payment/orders/"), { timeout: 15000 });
    await expectText(page, "Status Order", "payment order detail");
    await page.goBack();

    await goto(page, "/statistics");
    await expectText(page, "Statistics", "statistics dashboard");
    await expectText(page, "Page views", "statistics page views");
    await expectText(page, "Product Performance", "statistics product performance");

    await assertNoUiErrors(tracker);
  });

  await withLoggedInPage("buyer", users.buyer, async (page, tracker) => {
    await goto(page, "/learn");
    await expectText(page, "My Courses", "learner dashboard");
    await expectText(page, "Content System Course", "buyer course enrollment");
    await page.getByRole("link", { name: /Lanjut belajar|Buka course/ }).first().click();
    await expectText(page, "Content System Course", "course player");
    await page.getByRole("button", { name: "Video funnel dari konten ke checkout" }).click();
    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await expectText(page, "Selesai", "lesson completed status");
    await page.getByRole("button", { name: "Menulis hook untuk produk digital" }).click();
    await page.getByLabel("Menarik perhatian dan mengaitkan problem").check();
    await page.locator("textarea").last().fill("CTA");
    await page.getByRole("button", { name: "Submit quiz" }).first().click();
    await expectText(page, "Skor", "quiz submission summary");

    await assertNoUiErrors(tracker);
  });
}

async function adminArea() {
  await withLoggedInPage("admin", users.admin, async (page, tracker) => {
    await goto(page, "/admin");
    await expectText(page, "Platform Overview", "admin overview");

    await goto(page, "/admin/users");
    await expectText(page, "Users", "admin users");
    await page.locator('input[name="q"]').fill("creator");
    await page.locator('select[name="status"]').selectOption("ACTIVE");
    await page.getByRole("button", { name: "Filter" }).click();
    await expectUrlContains(page, "q=creator", "admin user filter url");
    await expectText(page, "creator@content-monitor.local", "filtered creator user");
    const creatorUserRow = page.locator("article").filter({ hasText: "creator@content-monitor.local" }).first();
    await creatorUserRow.locator('select').selectOption("ACTIVE");
    await creatorUserRow.getByRole("button", { name: "Simpan" }).click();
    await expectText(page, "creator@content-monitor.local", "user moderation save");

    await goto(page, "/admin/content");
    await expectText(page, "Content", "admin content");
    await page.locator('input[name="q"]').fill("checklist");
    await page.locator('select[name="status"]').selectOption("PUBLISHED");
    await page.locator('select[name="type"]').selectOption("BLOG");
    await page.getByRole("button", { name: "Filter" }).click();
    await expectText(page, "Checklist launch produk digital tanpa tim besar", "filtered admin content");

    await goto(page, "/admin/products");
    await expectText(page, "Products", "admin products");
    await page.locator('input[name="q"]').fill("Disabled");
    await page.locator('select[name="moderationStatus"]').selectOption("DISABLED");
    await page.getByRole("button", { name: "Filter" }).click();
    await expectText(page, "Disabled Growth Swipefile", "filtered disabled product");
    const productRow = page.locator("article").filter({ hasText: "Disabled Growth Swipefile" }).first();
    await productRow.locator("select").selectOption("DISABLED");
    await productRow.getByRole("button", { name: "Simpan" }).click();
    await expectText(page, "Disabled Growth Swipefile", "product moderation save");

    await goto(page, "/admin/orders");
    await expectText(page, "Orders", "admin orders");
    await page.locator('input[name="q"]').fill("Content System Course");
    await page.locator('select[name="status"]').selectOption("PAID");
    await page.getByRole("button", { name: "Filter" }).click();
    await expectText(page, "Content System Course", "filtered admin orders");

    await goto(page, "/admin/payments");
    await expectText(page, "Payments", "admin payments");
    await page.locator('input[name="q"]').fill("Content System Course");
    await page.locator('select[name="status"]').selectOption("PAID");
    await page.getByRole("button", { name: "Filter" }).click();
    await expectText(page, "Content System Course", "filtered admin payments");

    await goto(page, "/admin/settings");
    await expectText(page, "Platform Settings", "admin settings");
    await page.getByLabel("Platform fee (%)").fill("5");
    await page.getByLabel("Max upload (MB)").fill("25");
    const settingsResponse = page.waitForResponse((response) =>
      response.url().includes("/api/trpc/admin.updatePlatformSettings"),
    );
    await page.getByRole("button", { name: "Simpan settings" }).click();
    await assertTrpcOk(await settingsResponse, "admin settings update mutation");
    await expectText(page, "Settings tersimpan.", "settings saved");

    await goto(page, "/admin/statistics");
    await expectText(page, "Platform Statistics", "admin statistics");
    await expectText(page, "Revenue", "admin revenue statistics");

    await assertNoUiErrors(tracker);
  });
}

async function testContentBankCrud(page, path, label) {
  const title = `${artifactPrefix} ${label}`;

  await goto(page, path);
  await expectText(page, label, `${label} page`);
  await page.locator('input[name="title"]').fill(title);
  await page.locator('select[name="status"]').selectOption("DRAFT");
  await page.locator('textarea[name="body"]').fill(`Body ${title}`);
  await page.getByRole("button", { name: "Tambah" }).click();
  await expectText(page, title, `${label} created`);

  await page.getByPlaceholder("Cari...").fill(title);
  await expectText(page, title, `${label} search result`);
  await selectRadixOption(page, page.locator('button[role="combobox"]').first(), "Draft");
  await expectText(page, title, `${label} status filter result`);
  const row = page.locator("article").filter({ hasText: title }).first();
  await page.getByRole("button", { name: `Hapus ${title}` }).click();
  await row.waitFor({ state: "hidden", timeout: 10000 });
}

async function testProductCrud(page, productKind) {
  const isEbook = productKind === "e-book";
  const title = `${artifactPrefix} ${isEbook ? "Ebook" : "Course"}`;
  const slug = normalizeSlug(title);
  const path = isEbook ? "/produk/e-book" : "/produk/course";

  await goto(page, path);
  await expectText(page, isEbook ? "E-book" : "Course", `${productKind} page`);
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="slug"]').fill(slug);
  await page.locator('input[name="price"]').fill(isEbook ? "99000" : "149000");
  await page.locator('textarea[name="description"]').fill(`Produk dari ${artifactPrefix}`);
  await page.locator('input[name="coverUrl"]').fill("https://placehold.co/1200x630/png?text=QA");
  if (isEbook) {
    await page.locator('input[name="fileUrl"]').fill("https://example.com/qa.pdf");
  }
  await page.locator('select[name="status"]').selectOption("DRAFT");
  await page.getByRole("button", { name: "Tambah" }).click();
  await expectText(page, title, `${productKind} created`);

  await page.getByPlaceholder("Cari...").fill(title);
  await selectRadixOption(page, page.locator('button[role="combobox"]').first(), "Draft");
  const row = page.locator("article").filter({ hasText: title }).first();
  await expectLocator(row, `${productKind} created row`);
  await row.getByRole("link", { name: "Detail" }).click();
  await expectText(page, title, `${productKind} detail`);

  const updatedTitle = `${title} Updated`;
  const titleInput = page.locator('input[name="title"]').first();
  const detailForm = page.locator("form").filter({ has: titleInput }).first();
  await titleInput.click();
  await titleInput.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await titleInput.pressSequentially(updatedTitle);
  const titleValue = await titleInput.inputValue();
  if (titleValue !== updatedTitle) {
    throw new Error(`${productKind} title input was not updated before submit: ${titleValue}`);
  }
  const formEntries = await detailForm.evaluate((form) => Array.from(new FormData(form).entries()));
  const submittedTitles = formEntries.filter(([name]) => name === "title").map(([, value]) => String(value));
  if (submittedTitles.length !== 1 || submittedTitles[0] !== updatedTitle) {
    throw new Error(`${productKind} form data had unexpected title entries before submit: ${JSON.stringify(submittedTitles)}`);
  }
  const updateResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/products.update") &&
    response.status() === 200 &&
    (response.request().postData() ?? "").includes(updatedTitle),
  );
  await detailForm.getByRole("button", { name: "Simpan" }).click();
  const updateResult = await updateResponse;
  const updatePayload = await assertTrpcOk(updateResult, `${productKind} update mutation`);
  const updatedProduct = getTrpcResultData(updatePayload);
  if (updatedProduct?.title !== updatedTitle) {
    throw new Error(`${productKind} update returned unexpected title: ${updatedProduct?.title ?? "missing"}`);
  }
  await page.getByRole("link", { name: "Kembali" }).click();
  await page.waitForURL((url) => url.pathname === path, { timeout: 15000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Cari...").fill(updatedTitle);
  await expectText(page, updatedTitle, `${productKind} updated in list`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Hapus ${updatedTitle}` }).click();
  await page.getByText(updatedTitle).waitFor({ state: "hidden", timeout: 10000 });
}

async function testCourseCrud(page) {
  const title = `${artifactPrefix} Course Builder`;
  const slug = normalizeSlug(title);

  await goto(page, "/produk/course");
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="slug"]').fill(slug);
  await page.locator('input[name="price"]').fill("179000");
  await page.locator('textarea[name="description"]').fill("Course builder dari UI regression.");
  await page.locator('select[name="status"]').selectOption("DRAFT");
  await page.getByRole("button", { name: "Tambah" }).click();
  await expectText(page, title, "course builder product created");

  await page.getByPlaceholder("Cari...").fill(title);
  const productRow = page.locator("article").filter({ hasText: title }).first();
  await productRow.getByRole("link", { name: "Detail" }).click();
  await expectText(page, "Struktur Course", "course builder structure");

  const moduleTitle = `${artifactPrefix} Module`;
  const moduleUpdated = `${moduleTitle} Updated`;
  const lessonTitle = `${artifactPrefix} Lesson`;
  const lessonUpdated = `${lessonTitle} Updated`;
  const createModuleResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/courses.createModule") && response.status() === 200,
  );
  await page.getByPlaceholder("Nama module").fill(moduleTitle);
  await page.getByRole("button", { name: "Tambah Module" }).click();
  const createModulePayload = await assertTrpcOk(await createModuleResponse, "course module create mutation");
  const createdModule = getTrpcResultData(createModulePayload);
  if (createdModule?.title !== moduleTitle) {
    throw new Error(`course module create returned unexpected title: ${createdModule?.title ?? "missing"}`);
  }
  const moduleRecord = await prisma.courseModule.findUnique({ where: { id: createdModule.id } });
  if (!moduleRecord || moduleRecord.productId !== createdModule.productId) {
    throw new Error(`course module was not persisted correctly: ${JSON.stringify(moduleRecord)}`);
  }
  await goto(page, `/produk/course/${createdModule.productId}`);
  let moduleRow = await getCourseModuleRow(page, moduleTitle);

  const updateModuleResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/courses.updateModule") && response.status() === 200,
  );
  await moduleRow.locator('input[aria-label="Nama module"]').fill(moduleUpdated);
  await moduleRow.getByRole("button", { name: `Simpan ${moduleTitle}` }).click();
  const updateModulePayload = await assertTrpcOk(await updateModuleResponse, "course module update mutation");
  const updatedModule = getTrpcResultData(updateModulePayload);
  if (updatedModule?.title !== moduleUpdated) {
    throw new Error(`course module update returned unexpected title: ${updatedModule?.title ?? "missing"}`);
  }
  await goto(page, `/produk/course/${createdModule.productId}`);
  moduleRow = await getCourseModuleRow(page, moduleUpdated);

  await moduleRow.getByPlaceholder("Lesson baru").fill(lessonTitle);
  await moduleRow.locator('select[name="type"]').selectOption("VIDEO");
  await moduleRow.getByRole("button", { name: "Lesson" }).click();
  await expectText(page, lessonTitle, "course lesson created");

  await page.getByRole("button", { name: lessonTitle }).click();
  const lessonEditor = page.locator("form").filter({ has: page.getByPlaceholder("Judul lesson") }).first();
  await lessonEditor.getByPlaceholder("Judul lesson").fill(lessonUpdated);
  await lessonEditor.locator('select[name="type"]').selectOption("READING");
  await lessonEditor.locator('input[name="duration"]').fill("12");
  await lessonEditor.getByPlaceholder("Tulis materi bacaan lesson").fill("Materi lesson QA.");
  await lessonEditor.getByPlaceholder("URL file/materi tambahan").fill("https://example.com/lesson.pdf");
  await lessonEditor.getByRole("button", { name: "Simpan Lesson" }).click();
  await expectText(page, lessonUpdated, "course lesson updated");

  page.once("dialog", (dialog) => dialog.accept());
  await lessonEditor.getByRole("button", { name: "Hapus Lesson" }).click();
  await page.getByText(lessonUpdated).waitFor({ state: "hidden", timeout: 10000 });

  moduleRow = await getCourseModuleRow(page, moduleUpdated);
  page.once("dialog", (dialog) => dialog.accept());
  await moduleRow.getByRole("button", { name: `Hapus ${moduleUpdated}` }).click();
  await waitForCourseModuleHidden(page, moduleUpdated);

  await page.getByRole("link", { name: "Kembali" }).click();
  await page.getByPlaceholder("Cari...").fill(title);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Hapus ${title}` }).click();
  await page.getByText(title).waitFor({ state: "hidden", timeout: 10000 });
}

async function getCourseModuleRow(page, title) {
  const rows = page.locator("article").filter({ has: page.locator('input[aria-label="Nama module"]') });
  await expectLocator(rows.first(), "course module row");
  const count = await rows.count();

  for (let index = 0; index < count; index += 1) {
    const row = rows.nth(index);
    const value = await row.locator('input[aria-label="Nama module"]').inputValue();

    if (value === title) {
      return row;
    }
  }

  throw new Error(`Course module row not found: ${title}`);
}

async function waitForCourseModuleHidden(page, title) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const rows = page.locator("article").filter({ has: page.locator('input[aria-label="Nama module"]') });
    const count = await rows.count();
    let found = false;

    for (let index = 0; index < count; index += 1) {
      const value = await rows.nth(index).locator('input[aria-label="Nama module"]').inputValue().catch(() => "");
      found ||= value === title;
    }

    if (!found) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Course module row still visible: ${title}`);
}

async function testAppearance(page) {
  const blockTitle = `${artifactPrefix} Link`;
  const updatedTitle = `${blockTitle} Updated`;

  await goto(page, "/appearance");
  await expectText(page, "Appearance", "appearance editor");
  await page.locator('input[name="displayName"]').fill("Rina Creator");
  await page.locator('textarea[name="bio"]').first().fill(`Appearance ${artifactPrefix}`);
  await page.locator('select[name="buttonStyle"]').selectOption("SOLID");
  await page.getByRole("button", { name: "Simpan halaman" }).click();
  await page.waitForLoadState("networkidle").catch(() => null);

  await page.locator('input[name="title"]').fill(blockTitle);
  await page.locator('input[name="url"]').fill("https://example.com/qa-ui");
  await page.getByRole("button", { name: "Tambah block" }).click();
  await expectText(page, blockTitle, "appearance block created");

  let blockRow = page.locator("article").filter({ hasText: blockTitle }).first();
  const hideBlockResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/appearance.updateBlock") && response.status() === 200,
  );
  await blockRow.getByRole("checkbox").click();
  await assertTrpcOk(await hideBlockResponse, "appearance block hide mutation");
  await expectText(page, "Hidden", "appearance block hidden");
  blockRow = page.locator("article").filter({ hasText: blockTitle }).first();
  const showBlockResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/appearance.updateBlock") && response.status() === 200,
  );
  await blockRow.getByRole("checkbox").click();
  await assertTrpcOk(await showBlockResponse, "appearance block show mutation");
  blockRow = page.locator("article").filter({ hasText: blockTitle }).first();
  await blockRow.getByRole("button", { name: `Edit ${blockTitle}` }).click();
  const editBlockForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Simpan block" }) }).first();
  await editBlockForm.locator('input[name="title"]').fill(updatedTitle);
  await editBlockForm.getByRole("button", { name: "Simpan block" }).click();
  await expectText(page, updatedTitle, "appearance block updated");

  blockRow = page.locator("article").filter({ hasText: updatedTitle }).first();
  const moveBlockResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/appearance.moveBlock") && response.status() === 200,
  );
  await blockRow.getByRole("button", { name: `Pindah naik ${updatedTitle}` }).click();
  await assertTrpcOk(await moveBlockResponse, "appearance block move mutation");
  await goto(page, "/appearance");
  blockRow = page.locator("article").filter({ hasText: updatedTitle }).first();
  const deleteBlockResponse = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/appearance.deleteBlock"),
  );
  await blockRow.getByRole("button", { name: `Hapus ${updatedTitle}` }).click();
  await assertTrpcOk(await deleteBlockResponse, "appearance block delete mutation");
  await blockRow.waitFor({ state: "hidden", timeout: 10000 });
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

  child.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  child.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(`Next server exited with code ${code ?? "null"} signal ${signal ?? "null"}.`);
    }
  });

  return child;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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

async function runPhase(name, callback) {
  const startedAt = Date.now();
  console.log(`\n[RUN] ${name}`);

  try {
    await callback();
    const elapsedMs = Date.now() - startedAt;
    phaseResults.push({ name, elapsedMs });
    console.log(`[PASS] ${name} (${elapsedMs}ms)`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

async function withLoggedInPage(label, credentials, callback) {
  await withTrackedPage(label, async (page, tracker) => {
    await loginViaUi(page, credentials);
    await callback(page, tracker);
  });
}

async function withTrackedPage(label, callback) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const tracker = trackUiErrors(page, label);

  try {
    await callback(page, tracker);
  } finally {
    await context.close();
  }
}

async function loginViaUi(page, credentials) {
  await goto(page, "/login");
  await page.getByPlaceholder("Email").fill(credentials.email);
  await page.getByPlaceholder("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  await expectText(page, "Events", `login ${credentials.email}`);
}

async function goto(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => null);
}

async function expectText(page, text, label) {
  await expectLocator(page.getByText(text, { exact: false }).first(), label);
}

async function expectLocator(locator, label) {
  await locator.waitFor({ state: "visible", timeout: 15000 }).catch((error) => {
    throw new Error(`Expected visible: ${label}. ${error.message}`);
  });
}

async function expectUrlContains(page, expected, label) {
  await page.waitForURL((url) => url.href.includes(expected), { timeout: 15000 }).catch((error) => {
    throw new Error(`Expected URL containing ${expected} for ${label}. Current URL: ${page.url()}. ${error.message}`);
  });
}

async function assertTrpcOk(response, label) {
  const payload = await response.json().catch(() => null);
  const results = Array.isArray(payload) ? payload : [payload];
  const error = results.find((result) => result?.error)?.error;

  if (error) {
    throw new Error(`${label} failed: ${error.message ?? JSON.stringify(error)}`);
  }

  return payload;
}

function getTrpcResultData(payload) {
  const firstResult = Array.isArray(payload) ? payload[0] : payload;

  return firstResult?.result?.data?.json ?? firstResult?.result?.data;
}

async function selectRadixOption(page, trigger, optionName) {
  await trigger.click();
  await page.getByRole("option", { name: optionName }).click();
  await page.waitForLoadState("networkidle").catch(() => null);
}

function trackUiErrors(page, label) {
  const errors = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    const text = message.text();
    if (isIgnoredConsoleError(text)) {
      return;
    }

    errors.push(`[${label}] console.error: ${text}`);
  });

  page.on("pageerror", (error) => {
    errors.push(`[${label}] pageerror: ${error.message}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 500 && isSameOrigin(response.url())) {
      errors.push(`[${label}] HTTP ${response.status()}: ${response.url()}`);
    }
  });

  return errors;
}

async function assertNoUiErrors(errors) {
  await delay(200);

  if (errors.length) {
    throw new Error(`UI errors detected:\n${errors.join("\n")}`);
  }
}

function clearExpectedUiErrors(errors, predicate) {
  const unexpected = errors.filter((error) => !predicate(error));
  errors.splice(0, errors.length, ...unexpected);
}

function isSameOrigin(url) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function isIgnoredConsoleError(text) {
  return [
    "api.dicebear.com",
    "placehold.co",
    "example.com",
    "youtube.com",
    "ytimg.com",
    "chrome-error://chromewebdata",
    "net::ERR_ABORTED",
    "status of 404",
  ].some((pattern) => text.includes(pattern));
}

async function cleanupArtifacts() {
  await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: "qa-enrollment-buyer-course",
          lessonId: "qa-lesson-video-funnel",
        },
      },
      update: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
        completedAt: null,
      },
      create: {
        id: "qa-progress-buyer-video",
        enrollmentId: "qa-enrollment-buyer-course",
        lessonId: "qa-lesson-video-funnel",
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
    await tx.quizAttempt.deleteMany({
      where: {
        enrollmentId: "qa-enrollment-buyer-course",
        quizId: "qa-quiz-lesson-hook",
        id: { not: "qa-attempt-buyer-hook-passed" },
      },
    });
    await tx.publicPageBlock.deleteMany({
      where: { title: { startsWith: "QA UI" } },
    });
    await tx.contentItem.deleteMany({
      where: { title: { startsWith: "QA UI" } },
    });
    await tx.product.deleteMany({
      where: { title: { startsWith: "QA UI" } },
    });
    await tx.passwordResetToken.deleteMany({
      where: { user: { email: { startsWith: "ui-test-" } } },
    });
    await tx.user.deleteMany({
      where: { email: { startsWith: "ui-test-" } },
    });
  });
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
