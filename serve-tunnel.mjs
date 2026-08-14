import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import localtunnel from "localtunnel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const distDir = path.join(__dirname, "dist");

const server = http.createServer((req, res) => {
  let urlPath = req.url?.split("?")[0] || "/";
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.join(distDir, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
    res.end(data);
  });
});

const PORT = 4173;

server.listen(PORT, async () => {
  console.log(`[server] 静态服务器已启动: http://localhost:${PORT}`);

  try {
    const tunnel = await localtunnel({ port: PORT });
    console.log(`[tunnel] 公网访问地址: ${tunnel.url}`);
    console.log("[info] 将以上链接分享给朋友即可访问网站！");
    console.log("[info] 按 Ctrl+C 停止服务");

    tunnel.on("close", () => {
      console.log("[tunnel] 隧道已关闭");
    });
    tunnel.on("error", (err) => {
      console.error("[tunnel] 隧道错误:", err.message);
    });
  } catch (err) {
    console.error("[tunnel] 创建隧道失败:", err.message);
    console.log("[info] 网站仍可在本地访问: http://localhost:" + PORT);
  }
});
