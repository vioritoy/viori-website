import { build } from "esbuild";
import path from "node:path";

const projectDir = process.cwd();

await build({
  absWorkingDir: projectDir,
  entryPoints: [path.join(projectDir, "script.ts")],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: path.join(projectDir, "script.js"),
  sourcemap: false
});
