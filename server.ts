import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Serve static assets from the Vite build output directory
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Health check endpoints for Cloud Run
app.get(["/health", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA fallback: send index.html for all non-static requests
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Graceful fallback during deployment
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Remix Zoya - AI Voice Assistant</title>
    <meta http-equiv="refresh" content="2" />
  </head>
  <body style="background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
    <div>Loading Remix Zoya...</div>
  </body>
</html>`);
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
