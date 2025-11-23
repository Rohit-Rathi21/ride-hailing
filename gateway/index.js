const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Needed to forward JSON bodies to backend services
const fixBody = (proxyReq, req) => {
  if (!req.body || !Object.keys(req.body).length) return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", "application/json");
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
};

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ---------- AUTH ----------
app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://auth-service:3001",
    changeOrigin: true,
    onProxyReq: fixBody,
  })
);

// ---------- RIDER ----------
app.use(
  "/rider",
  createProxyMiddleware({
    target: "http://rider-service:3002",
    changeOrigin: true,
    onProxyReq: fixBody,
  })
);

// ---------- DRIVER ----------
app.use(
  "/driver",
  createProxyMiddleware({
    target: "http://driver-service:3003",
    changeOrigin: true,
    onProxyReq: fixBody,
  })
);

// ---------- RIDE ----------
app.use(
  "/ride",
  createProxyMiddleware({
    target: "http://ride-service:3004",
    changeOrigin: true,
    onProxyReq: fixBody,
  })
);

app.listen(3000, () => {
  console.log("🚀 API Gateway running on port 3000");
});
