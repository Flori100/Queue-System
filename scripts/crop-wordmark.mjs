import fs from "fs";
import jpeg from "jpeg-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "../public/qlist-brand-source.jpg");
const outPath = path.join(__dirname, "../public/qlist-wordmark.jpg");

const srcBuf = fs.readFileSync(srcPath);
const src = jpeg.decode(srcBuf, { useTArray: true });
const { width: W, height: H, data: s } = src;
// jpeg-js decode returns RGB (3 bytes per pixel)
const bpp = 3;

const x0 = 62;
const y0 = 118;
const cw = 900;
const ch = 140;

const d = new Uint8Array(cw * ch * 4);
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const sx = x0 + x;
    const sy = y0 + y;
    const si = (sy * W + sx) * bpp;
    const di = (y * cw + x) * 4;
    d[di] = s[si];
    d[di + 1] = s[si + 1];
    d[di + 2] = s[si + 2];
    d[di + 3] = 255;
  }
}

const out = jpeg.encode({ data: d, width: cw, height: ch }, 92);
fs.writeFileSync(outPath, out.data);
console.log("wrote", outPath, cw, ch);
