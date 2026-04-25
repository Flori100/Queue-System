import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const body = fs.readFileSync(path.join(__dirname, "../src/qlist-logo.svg"), "utf8");

for (const rel of ["../public/logo.svg", "../public/qlist-logo.svg", "../src/assets/logo.svg"]) {
  const out = path.join(__dirname, rel);
  fs.writeFileSync(out, body);
  console.log("wrote", out);
}
