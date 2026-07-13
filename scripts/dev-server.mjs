import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = Number(process.env.PORT) || 4000;

/** Local dev ports (see README). Override with STUDIO_PORT, IMAGES_PORT, VIDEOS_PORT. */
const apps = {
  studio: Number(process.env.STUDIO_PORT) || 3000,
  images: Number(process.env.IMAGES_PORT) || 3001,
  videos: Number(process.env.VIDEOS_PORT) || 3002,
};

const devQuery =
  process.env.DEV_QUERY ||
  "?tutorials=1099&courses=1100&Quizzes=1101&unzip=out-out-out&ran=I";

const mime = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

function rewriteAnchorsForDev(html) {
  let out = html;
  for (const [sub, appPort] of Object.entries(apps)) {
    const prodOrigin = `https://${sub}.mkacademy.ca`;
    const localOrigin = `http://localhost:${appPort}`;
    const prodHost = `${sub}.mkacademy.ca`;
    const localHost = `localhost:${appPort}`;

    out = out.replaceAll(prodOrigin, localOrigin);
    out = out.replaceAll(
      new RegExp(`>\\s*${prodHost}\\s*</a`, "gi"),
      `>${localHost}</a`,
    );
  }

  for (const appPort of Object.values(apps)) {
    out = out.replaceAll(
      new RegExp(`(href="http://localhost:${appPort})[^"]*"`, "g"),
      `$1${devQuery}"`,
    );
  }

  return out;
}

const server = createServer(async (req, res) => {
  const path = req.url?.split("?")[0] || "/";
  const filePath = join(root, path === "/" ? "index.html" : path.slice(1));

  try {
    let body = await readFile(filePath);
    const type = mime[extname(filePath)] || "application/octet-stream";

    if (path === "/" || path === "/index.html") {
      body = Buffer.from(rewriteAnchorsForDev(body.toString("utf8")), "utf8");
    }

    res.writeHead(200, { "Content-Type": type });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Landing dev server: http://localhost:${port}`);
  console.log("Anchor rewrites:");
  for (const [sub, appPort] of Object.entries(apps)) {
    console.log(`  ${sub}.mkacademy.ca → http://localhost:${appPort}${devQuery}`);
  }
});
