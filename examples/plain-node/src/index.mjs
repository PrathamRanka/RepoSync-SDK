import { readFile } from "node:fs/promises";

const projects = JSON.parse(await readFile(new URL("./projects.json", import.meta.url), "utf8"));

for (const project of projects) {
  console.log(`${project.title}: ${project.description}`);
}
