import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const args = new Map(
  process.argv.slice(2).map((argument, index, values) => {
    if (!argument.startsWith("--")) return [argument, undefined];
    return [argument, values[index + 1]?.startsWith("--") ? undefined : values[index + 1]];
  }),
);
const tag = args.get("--tag");
const artifactsDirectory = args.get("--artifacts");

if (!tag || !tag.startsWith("v")) {
  throw new Error("A version tag such as v2.0.0 is required.");
}

const version = tag.slice(1);
const packageManifests = await Promise.all(
  ["core", "cli"].map(async (directory) => {
    const path = join("packages", directory, "package.json");
    return [directory, JSON.parse(await readFile(path, "utf8"))];
  }),
);

for (const [directory, manifest] of packageManifests) {
  if (manifest.version !== version) {
    throw new Error(`${directory} is ${manifest.version}; expected ${version}.`);
  }
}

const cliManifest = packageManifests.find(([directory]) => directory === "cli")?.[1];
const coreDependency = cliManifest.dependencies["@reposync/core"];
if (coreDependency !== version && coreDependency !== `workspace:${version}`) {
  throw new Error("CLI must depend on the matching Core release.");
}

if (artifactsDirectory) {
  for (const name of ["core", "cli"]) {
    const archive = join(artifactsDirectory, `reposync-${name}-${version}.tgz`);
    const manifest = JSON.parse(
      execFileSync("tar", ["-xOf", archive, "package/package.json"], {
        encoding: "utf8",
      }),
    );
    if (manifest.version !== version) {
      throw new Error(`${name} archive is ${manifest.version}; expected ${version}.`);
    }
    if (name === "cli" && manifest.dependencies["@reposync/core"] !== version) {
      throw new Error("CLI archive does not resolve the matching Core version.");
    }
  }
}

console.log(`Release ${version} metadata and artifacts are valid.`);
