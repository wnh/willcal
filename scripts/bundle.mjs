// Packages the WillCal app payload (HTML + JS + WASM + production node_modules)
// into build/willcal.tgz. There is no NW.js runtime inside: extract it on the
// Mac and point your existing NW.js runtime at the willcal/ directory, e.g.
//   tar xzf willcal.tgz && /path/to/nwjs.app/Contents/MacOS/nwjs ./willcal
//
// The payload is arch-independent: node-sqlite3-wasm is WASM and every other
// runtime dep is pure JS, so a bundle built on Linux runs on an M-series Mac.
import { cp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const BUILD = `${ROOT}build`;
const STAGE = `${BUILD}/willcal`;

// esbuild marks all deps as external, so production node_modules must ship
// alongside the bundled dist/ output.
const APP_FILES = ["index.html", "notification.html", "dist"];

async function main() {
  await rm(BUILD, { recursive: true, force: true });
  await mkdir(STAGE, { recursive: true });

  for (const f of APP_FILES) {
    await cp(`${ROOT}${f}`, `${STAGE}/${f}`, { recursive: true });
  }

  // Install production-only deps into the payload (keeps devDeps like
  // esbuild/typescript out). npm ci needs the lockfile to match package.json,
  // so copy both, install, then trim the shipped manifest.
  await cp(`${ROOT}package.json`, `${STAGE}/package.json`);
  await cp(`${ROOT}package-lock.json`, `${STAGE}/package-lock.json`);
  execFileSync("npm", ["ci", "--omit=dev"], { cwd: STAGE, stdio: "inherit" });

  const pkg = JSON.parse(await readFile(`${ROOT}package.json`, "utf8"));
  await writeFile(
    `${STAGE}/package.json`,
    JSON.stringify(
      { name: pkg.name, version: pkg.version, main: pkg.main, dependencies: pkg.dependencies },
      null,
      2,
    ),
  );
  await rm(`${STAGE}/package-lock.json`, { force: true });

  execFileSync("tar", ["-czf", `${BUILD}/willcal.tgz`, "-C", BUILD, "willcal"], {
    stdio: "inherit",
  });

  console.log(`\nDone. Payload dir: ${STAGE}\nArchive: ${BUILD}/willcal.tgz`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
