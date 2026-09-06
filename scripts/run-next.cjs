"use strict";

const { spawnSync } = require("child_process");
const { existsSync, readdirSync } = require("fs");
const { dirname, join } = require("path");

const MIN_MAJOR = 20;

function major(version) {
  return Number(String(version).replace(/^v/, "").split(".")[0]);
}

function findNewerNode() {
  const candidates = [];
  if (process.env.UNLIMITED_NOTE_NODE) {
    candidates.push(process.env.UNLIMITED_NOTE_NODE);
  }

  const nRoot = "/usr/local/n/versions/node";
  if (existsSync(nRoot)) {
    const versions = readdirSync(nRoot)
      .filter((name) => major(name) >= MIN_MAJOR)
      .sort((a, b) => {
        const [aMaj, aMin = 0, aPat = 0] = a.split(".").map(Number);
        const [bMaj, bMin = 0, bPat = 0] = b.split(".").map(Number);
        return bMaj - aMaj || bMin - aMin || bPat - aPat;
      });
    for (const version of versions) {
      candidates.push(join(nRoot, version, "bin", "node"));
    }
  }

  return candidates.find((bin) => existsSync(bin)) ?? null;
}

if (major(process.version) < MIN_MAJOR) {
  const node = findNewerNode();
  if (!node) {
    console.error(
      `Limitless Note needs Node ${MIN_MAJOR}+. This shell is using ${process.version}.`,
    );
    process.exit(1);
  }

  const result = spawnSync(node, [__filename, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${dirname(node)}${require("path").delimiter}${process.env.PATH}`,
    },
  });
  process.exit(result.status ?? 1);
}

const nextBin = join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
