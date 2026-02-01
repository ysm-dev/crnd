import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const PACKAGES_DIR = resolve(ROOT_DIR, "packages/@crnd");
const DIST_DIR = resolve(ROOT_DIR, "dist");

interface RootManifest {
  name: string;
  version: string;
  license: string;
  description: string;
  repository: { type: string; url: string };
  homepage: string;
  keywords: string[];
  author: string;
}

const rootManifest: RootManifest = JSON.parse(
  readFileSync(resolve(ROOT_DIR, "package.json"), "utf-8"),
);

const {
  version,
  license,
  repository,
  description,
  homepage,
  keywords,
  author,
} = rootManifest;

interface Platform {
  os: string;
  cpu: string;
  libc?: string;
  bunTarget: string;
  binaryName: string;
}

const PLATFORMS: Platform[] = [
  {
    os: "darwin",
    cpu: "arm64",
    bunTarget: "darwin-arm64",
    binaryName: "crnd-darwin-arm64",
  },
  {
    os: "darwin",
    cpu: "x64",
    bunTarget: "darwin-x64",
    binaryName: "crnd-darwin-x64",
  },
  {
    os: "linux",
    cpu: "x64",
    libc: "glibc",
    bunTarget: "linux-x64",
    binaryName: "crnd-linux-x64",
  },
  {
    os: "linux",
    cpu: "arm64",
    libc: "glibc",
    bunTarget: "linux-arm64",
    binaryName: "crnd-linux-arm64",
  },
  {
    os: "linux",
    cpu: "x64",
    libc: "musl",
    bunTarget: "linux-x64-musl",
    binaryName: "crnd-linux-x64-musl",
  },
  {
    os: "linux",
    cpu: "arm64",
    libc: "musl",
    bunTarget: "linux-arm64-musl",
    binaryName: "crnd-linux-arm64-musl",
  },
  {
    os: "win32",
    cpu: "x64",
    bunTarget: "windows-x64",
    binaryName: "crnd-windows-x64",
  },
];

function getPackageName(platform: Platform): string {
  const suffix =
    platform.libc === "musl"
      ? `-${platform.bunTarget}`
      : `-${platform.os}-${platform.cpu}`;
  return `@crnd/cli${suffix}`;
}

function getPackageDir(platform: Platform): string {
  const suffix =
    platform.libc === "musl"
      ? `cli-${platform.bunTarget}`
      : `cli-${platform.os}-${platform.cpu}`;
  return resolve(PACKAGES_DIR, suffix);
}

function generatePlatformPackage(platform: Platform): void {
  const packageName = getPackageName(platform);
  const packageDir = getPackageDir(platform);
  const manifestPath = resolve(packageDir, "package.json");

  const manifest: Record<string, unknown> = {
    name: packageName,
    version,
    license,
    repository,
    os: [platform.os],
    cpu: [platform.cpu],
  };

  if (platform.libc) {
    manifest.libc = [platform.libc];
  }

  console.info(`Generating ${manifestPath}`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Copy binary if it exists
  const ext = platform.os === "win32" ? ".exe" : "";
  const binarySource = resolve(ROOT_DIR, `${platform.binaryName}${ext}`);
  const binaryTarget = resolve(packageDir, `crnd${ext}`);

  if (existsSync(binarySource)) {
    console.info(`Copying binary to ${binaryTarget}`);
    copyFileSync(binarySource, binaryTarget);
    chmodSync(binaryTarget, 0o755);
  } else {
    console.warn(`Binary not found: ${binarySource}`);
  }
}

function generateMainPackage(): void {
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(resolve(DIST_DIR, "bin"), { recursive: true });

  // Generate optionalDependencies
  const optionalDependencies: Record<string, string> = {};
  for (const platform of PLATFORMS) {
    optionalDependencies[getPackageName(platform)] = version;
  }

  const manifest = {
    name: "crnd",
    version,
    description,
    license,
    repository,
    homepage,
    keywords,
    author,
    bin: {
      crnd: "bin/crnd",
    },
    files: ["bin"],
    optionalDependencies,
  };

  const manifestPath = resolve(DIST_DIR, "package.json");
  console.info(`Generating ${manifestPath}`);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Copy bin/crnd
  const binSource = resolve(ROOT_DIR, "bin/crnd");
  const binTarget = resolve(DIST_DIR, "bin/crnd");
  console.info(`Copying ${binTarget}`);
  copyFileSync(binSource, binTarget);
  chmodSync(binTarget, 0o755);

  // Copy README.md
  const readmeSource = resolve(ROOT_DIR, "README.md");
  const readmeTarget = resolve(DIST_DIR, "README.md");
  if (existsSync(readmeSource)) {
    console.info(`Copying ${readmeTarget}`);
    copyFileSync(readmeSource, readmeTarget);
  }

  // Copy LICENSE if exists
  const licenseSource = resolve(ROOT_DIR, "LICENSE");
  const licenseTarget = resolve(DIST_DIR, "LICENSE");
  if (existsSync(licenseSource)) {
    console.info(`Copying ${licenseTarget}`);
    copyFileSync(licenseSource, licenseTarget);
  }
}

// Main
console.info(`Version: ${version}\n`);

console.info("Generating platform packages...");
for (const platform of PLATFORMS) {
  generatePlatformPackage(platform);
}

console.info("\nGenerating main package...");
generateMainPackage();

console.info("\nDone!");
