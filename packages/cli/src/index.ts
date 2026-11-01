import { runCli } from "./cli.js";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export { parseArgs, runCli } from "./cli.js";
export { formatProjects, isOutputFormat, writeProjects } from "./output.js";

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
const modulePath = realpathSync(fileURLToPath(import.meta.url));
if (invokedPath === modulePath) {
  process.exitCode = await runCli(process.argv.slice(2));
}
