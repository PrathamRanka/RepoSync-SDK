import { access, readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const packages = [
  ["core", "@reposync/core"],
  ["cli", "@reposync/cli"],
];
const expectedVersion = process.env.REPOSYNC_EXPECTED_VERSION;

for (const [directory, name] of packages) {
  const packageJson = JSON.parse(
    await readFile(new URL(`packages/${directory}/package.json`, root), "utf8"),
  );
  const expected = [
    `packages/${directory}/dist/index.js`,
    `packages/${directory}/dist/index.d.ts`,
    `packages/${directory}/README.md`,
    `packages/${directory}/LICENSE`,
  ];
  for (const relative of expected) await access(new URL(relative, root));
  if (packageJson.name !== name) throw new Error(`Unexpected package name in ${directory}.`);
  if (expectedVersion && packageJson.version !== expectedVersion) {
    throw new Error(`${name} must be version ${expectedVersion}, found ${packageJson.version}.`);
  }
  if (packageJson.exports?.["."]?.import !== "./dist/index.js")
    throw new Error(`Invalid ESM export in ${directory}.`);
  console.log(`validated ${name} build contents and ESM export`);
}
