import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAY_MS = 24 * 60 * 60 * 1000;

export function runAttachmentCleanup({ dryRun = false } = {}) {
  const uploadsRoot = path.resolve(
    process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"),
  );
  const retentionYears = Math.max(
    1,
    Number.parseInt(process.env.RETENTION_YEARS || "5", 10) || 5,
  );
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - retentionYears;

  if (!fs.existsSync(uploadsRoot)) {
    console.log(`[attachment-cleanup] uploads dir missing: ${uploadsRoot}`);
    return { removed: 0, kept: 0 };
  }

  console.log(
    `[attachment-cleanup] root=${uploadsRoot} retention=${retentionYears}y cutoff<=${cutoffYear}${dryRun ? " dry-run" : ""}`,
  );

  const entries = fs.readdirSync(uploadsRoot, { withFileTypes: true });
  let removed = 0;
  let kept = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^\d{4}$/.test(entry.name)) continue;

    const year = Number.parseInt(entry.name, 10);
    const fullPath = path.join(uploadsRoot, entry.name);

    if (year > cutoffYear) {
      kept += 1;
      console.log(`[attachment-cleanup] keep ${entry.name}`);
      continue;
    }

    if (dryRun) {
      console.log(`[attachment-cleanup] would delete ${entry.name}`);
    } else {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`[attachment-cleanup] deleted ${entry.name}`);
    }
    removed += 1;
  }

  console.log(`[attachment-cleanup] done removed=${removed} kept=${kept}`);
  return { removed, kept };
}

export function scheduleAttachmentCleanup() {
  if (process.env.ATTACHMENT_CLEANUP === "0") {
    console.log("[attachment-cleanup] disabled (ATTACHMENT_CLEANUP=0)");
    return;
  }

  const run = () => {
    try {
      runAttachmentCleanup();
    } catch (err) {
      console.error("[attachment-cleanup] failed:", err);
    }
  };

  run();
  setInterval(run, DAY_MS).unref();
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    runAttachmentCleanup({ dryRun: process.argv.includes("--dry-run") });
  } catch (err) {
    console.error("[attachment-cleanup] failed:", err);
    process.exit(1);
  }
}
