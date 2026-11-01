import { runCli } from "./cli.js";
import { pathToFileURL } from "node:url";

export { parseArgs, runCli } from "./cli.js";
export { writeProjects } from "./output.js";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
