import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { execFile } from "child_process";
import http from "http";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const UPSTREAM = process.env.UPSTREAM || "http://127.0.0.1:18081";
const NS = process.env.K8S_NAMESPACE || "incloud-web";
const SA = process.env.K8S_SERVICEACCOUNT || "desktop-proxy";
const FORCE_AUTH = process.env.FORCE_AUTH === "1";
const AUTH_PREFIXES = (
  process.env.AUTH_PATH_PREFIXES || "/api/clusters/default/k8s"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const INSECURE = process.env.INSECURE_SKIP_VERIFY === "1";

function now() {
  return new Date().toISOString();
}
function log(...a) {
  console.log(`[proxy ${now()}]`, ...a);
}

let cachedToken = null;
let cachedExp = 0;

function decodeJwtExp(t) {
  try {
    const p = JSON.parse(
      Buffer.from(
        t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8")
    );
    return typeof p.exp === "number" ? p.exp : 0;
  } catch {
    return 0;
  }
}

function fetchToken() {
  return new Promise((resolve, reject) => {
    execFile(
      "kubectl",
      ["-n", NS, "create", "token", SA],
      { timeout: 20000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        const token = stdout.trim();
        if (!token) return reject(new Error("empty token"));
        cachedToken = token;
        cachedExp =
          decodeJwtExp(token) || Math.floor(Date.now() / 1000) + 50 * 60;
        log(
          `fetched token ${token.slice(0, 16)}… expIn=${
            cachedExp - Math.floor(Date.now() / 1000)
          }s`
        );
        resolve(token);
      }
    );
  });
}

async function getFreshToken() {
  const now = Math.floor(Date.now() / 1000);
  if (!cachedToken || cachedExp - now < 60) return await fetchToken();
  return cachedToken;
}

function needsAuth(path) {
  return AUTH_PREFIXES.some((p) => path.startsWith(p));
}

const app = express();

// PRE-PROXY MIDDLEWARE — set Authorization on req BEFORE proxy builds upstream request
app.use(async (req, res, next) => {
  const hasClientAuth = !!req.headers["authorization"];
  const willInject = FORCE_AUTH || (!hasClientAuth && needsAuth(req.url));
  log(
    `IN  ${req.method} ${req.url} clientAuth=${hasClientAuth} willInject=${willInject}`
  );

  if (!willInject) return next();

  try {
    const token = await getFreshToken();
    req.headers["authorization"] = `Bearer ${token}`;
    log(`SET auth header -> Bearer ${token.slice(0, 16)}…`);
    next();
  } catch (e) {
    log(`FAIL token: ${e.message}`);
    res.status(502).send(`Token fetch failed: ${e.message}`);
  }
});

const agent = INSECURE
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

const proxyMw = createProxyMiddleware({
  target: UPSTREAM,
  changeOrigin: false,
  ws: true,
  secure: !INSECURE,
  agent,
  onProxyReq(proxyReq, req, res) {
    // PROVE what we’re sending upstream
    const auth = proxyReq.getHeader("authorization");
    log(
      `UP  ${req.method} ${req.url} -> ${UPSTREAM} authHeader=${
        auth ? String(auth).slice(0, 24) + "…" : "NONE"
      }`
    );
  },
  onProxyRes(proxyRes, req, res) {
    log(`OUT ${proxyRes.statusCode} ${req.method} ${req.url} via ${UPSTREAM}`);
  },
  onError(err, req, res) {
    log(`ERR ${req.method} ${req.url}: ${err.message}`);
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`Proxy error: ${err.message}`);
  },
});

app.use("/", proxyMw);

const server = http.createServer(app);
server.on("upgrade", proxyMw.upgrade);

server.listen(PORT, () => {
  log(`listening http://127.0.0.1:${PORT}`);
  log(`upstream -> ${UPSTREAM}`);
  log(`auth prefixes -> ${AUTH_PREFIXES.join(", ")}`);
  log(`insecure TLS -> ${INSECURE ? "YES" : "NO"}`);
});
