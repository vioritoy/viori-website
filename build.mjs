import { build, context } from "esbuild";
import path from "node:path";

const projectDir = process.cwd();
const serveMode = process.argv.includes("--serve");

const buildOptions = {
  absWorkingDir: projectDir,
  entryPoints: [path.join(projectDir, "script.ts")],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: path.join(projectDir, "script.js"),
  // По умолчанию esbuild экранирует кириллицу в \uXXXX: файл раздувается
  // и его невозможно читать. Страницы объявляют UTF-8, так что это безопасно.
  charset: "utf8",
  sourcemap: false
};

if (serveMode) {
  // Локальна розробка: esbuild пересобирає script.ts на кожен запит.
  // sourcemap лишається вимкненим, щоб script.js на диску був байт-у-байт
  // таким самим, як після `npm run build`, і не засмічував git diff.
  const ctx = await context(buildOptions);
  const { hosts, port } = await ctx.serve({ servedir: projectDir, port: 3000 });
  const host = hosts.includes("127.0.0.1") ? "127.0.0.1" : hosts[0];
  console.log(`VIORI dev server: http://${host}:${port}`);
  console.log("Ctrl+C — зупинити");
} else {
  await build(buildOptions);
}
