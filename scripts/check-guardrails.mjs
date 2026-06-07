import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

const BACKEND_MAX_LINES = 500;
const FRONTEND_MAX_LINES = 1000;

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "migrations",
]);

const ignoredFiles = new Set([
  "bun.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "README.md",
]);

const checkedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
]);

const sourceRootsForNaming = new Set([
  "app",
  "components",
  "data",
  "lib",
  "prisma",
  "scripts",
  "server",
]);

const specialNextNames = new Set([
  "default",
  "error",
  "global-error",
  "layout",
  "loading",
  "not-found",
  "page",
  "route",
  "template",
]);

const failures = [];
const advisories = [];

function toRelative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function walk(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!ignoredDirectories.has(entry)) {
        files.push(...walk(fullPath));
      }
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function getSourceFiles() {
  return walk(root).filter((filePath) => {
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);
    return checkedExtensions.has(extension) && !ignoredFiles.has(fileName);
  });
}

function countLines(filePath) {
  const content = readFileSync(filePath, "utf8");
  if (content.length === 0) {
    return 0;
  }
  return content.split(/\r\n|\r|\n/).length;
}

function isBackendFile(relativePath) {
  return (
    relativePath.startsWith("server/") ||
    relativePath.startsWith("app/api/") ||
    relativePath.startsWith("lib/") ||
    relativePath.startsWith("prisma/") ||
    relativePath.endsWith(".config.ts")
  );
}

function isFrontendFile(relativePath) {
  return (
    relativePath.startsWith("components/") ||
    (relativePath.startsWith("app/") && !relativePath.startsWith("app/api/"))
  );
}

function checkLineLimits(files) {
  for (const filePath of files) {
    const relativePath = toRelative(filePath);
    const lineCount = countLines(filePath);

    if (isBackendFile(relativePath) && lineCount > BACKEND_MAX_LINES) {
      failures.push(
        `${relativePath} has ${lineCount} lines. Backend files must be ${BACKEND_MAX_LINES} lines or fewer.`,
      );
    }

    if (isFrontendFile(relativePath) && lineCount > FRONTEND_MAX_LINES) {
      failures.push(
        `${relativePath} has ${lineCount} lines. Frontend files must be ${FRONTEND_MAX_LINES} lines or fewer.`,
      );
    }
  }
}

function isKebabCase(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isAllowedRouteSegment(segment) {
  return (
    isKebabCase(segment) ||
    /^\[[a-z0-9-]+\]$/.test(segment) ||
    /^\[\.\.\.[a-z0-9-]+\]$/.test(segment) ||
    /^\([a-z0-9-]+\)$/.test(segment)
  );
}

function isAllowedFileName(fileName) {
  const extension = path.extname(fileName);
  const baseName = fileName.slice(0, -extension.length);

  if (specialNextNames.has(baseName)) {
    return true;
  }

  if (baseName === "globals" && extension === ".css") {
    return true;
  }

  return baseName.split(".").every((part) => isKebabCase(part));
}

function shouldCheckNaming(relativePath) {
  const [rootSegment] = relativePath.split("/");
  return sourceRootsForNaming.has(rootSegment);
}

function checkNaming(files) {
  for (const filePath of files) {
    const relativePath = toRelative(filePath);

    if (!shouldCheckNaming(relativePath)) {
      continue;
    }

    const segments = relativePath.split("/");
    const fileName = segments.at(-1);
    const directorySegments = segments.slice(0, -1);

    for (const segment of directorySegments) {
      if (!isAllowedRouteSegment(segment)) {
        failures.push(
          `${relativePath} uses directory "${segment}". Source directories must use kebab-case or Next.js route segment syntax.`,
        );
      }
    }

    if (!isAllowedFileName(fileName)) {
      failures.push(
        `${relativePath} uses file name "${fileName}". Source files must use kebab-case naming.`,
      );
    }
  }
}

function fileExists(relativePath) {
  try {
    statSync(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function checkTrpcStructure() {
  const gatewayExists = fileExists("app/api/trpc/[trpc]/route.ts");
  const requiredFiles = [
    "server/trpc/context.ts",
    "server/trpc/root.ts",
    "server/trpc/router.ts",
    "server/trpc/procedures.ts",
  ];

  if (!gatewayExists) {
    advisories.push("tRPC gateway is not implemented yet: app/api/trpc/[trpc]/route.ts");
    return;
  }

  for (const requiredFile of requiredFiles) {
    if (!fileExists(requiredFile)) {
      failures.push(`Missing tRPC support file: ${requiredFile}`);
    }
  }
}

function printResults() {
  if (advisories.length > 0) {
    console.log("Guardrail advisories:");
    for (const advisory of advisories) {
      console.log(`- ${advisory}`);
    }
    console.log("");
  }

  if (failures.length > 0) {
    console.error("Guardrail check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Guardrail check passed.");
}

const files = getSourceFiles();
checkLineLimits(files);
checkNaming(files);
checkTrpcStructure();
printResults();
