import type { NextConfig } from "next";
import path from "node:path";
import { execSync } from "node:child_process";

const appDir = path.basename(process.cwd());

const readBranch = () => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "main";
  }
};

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactCompiler: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_APP_DIR: appDir,
    NEXT_PUBLIC_GIT_BRANCH: readBranch(),
  },
};

export default nextConfig;
