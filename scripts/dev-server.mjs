import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = Number(process.env.PORT) || 4000;

function localIpv4Addresses() {
  try {
    const addresses = [];
    for (const ifaces of Object.values(networkInterfaces())) {
      for (const iface of ifaces ?? []) {
        if (iface.family === "IPv4" && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    return addresses;
  } catch {
    return [];
  }
}

const lanIps = localIpv4Addresses();
/** Prefer DEV_HOST, else first LAN IPv4, else localhost. */
const rewriteHost = process.env.DEV_HOST || lanIps[0] || "localhost";

/** Local dev ports (see README). Override with STUDIO_PORT, IMAGES_PORT, VIDEOS_PORT. */
const apps = {
  studio: Number(process.env.STUDIO_PORT) || 3000,
  images: Number(process.env.IMAGES_PORT) || 3001,
  videos: Number(process.env.VIDEOS_PORT) || 3002,
};

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
    const localOrigin = `http://${rewriteHost}:${appPort}`;
    const prodHost = `${sub}.mkacademy.ca`;
    const localHost = `${rewriteHost}:${appPort}`;

    out = out.replaceAll(prodOrigin, localOrigin);
    out = out.replaceAll(
      new RegExp(`>\\s*${prodHost}\\s*</a`, "gi"),
      `>${localHost}</a`,
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
  if (lanIps.length) {
    for (const ip of lanIps) {
      console.log(`  Network:            http://${ip}:${port}`);
    }
  } else {
    console.log("  Network:            (no local IPv4 found)");
  }
  console.log(`Anchor rewrites (→ ${rewriteHost}):`);
  for (const [sub, appPort] of Object.entries(apps)) {
    console.log(`  ${sub}.mkacademy.ca → http://${rewriteHost}:${appPort}`);
  }
});
