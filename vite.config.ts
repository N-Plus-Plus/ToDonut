import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import packageJson from "./package.json" with { type: "json" };

function optionalGitValue(command: string): string {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const sourceCommit = process.env.GITHUB_SHA?.slice(0, 12) || optionalGitValue("git rev-parse --short=12 HEAD");
const buildTimestamp = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : new Date().toISOString();
const buildId = process.env.GITHUB_RUN_ID || sourceCommit || `local-${buildTimestamp.replace(/[-:.TZ]/g, "").slice(0, 14)}`;

export default defineConfig({
  base: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/` : "./",
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_ID__: JSON.stringify(buildId),
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __SOURCE_COMMIT__: JSON.stringify(sourceCommit || null),
  },
  plugins: [react()],
});
