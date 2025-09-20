import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets but let our catch-all handle index.html
  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  // but dynamically rewrite hashed asset names so we always serve the latest build
  app.use("*", async (_req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");

      const assetsDir = path.resolve(distPath, "assets");
      const files = await fs.promises.readdir(assetsDir);

      const pickLatest = (pattern: RegExp): string | undefined => {
        const matches = files.filter((f) => pattern.test(f));
        if (matches.length === 0) return undefined;
        // Sort by filename as a stable heuristic (hashes change per build)
        matches.sort();
        return matches[matches.length - 1];
      };

      const latestJs = pickLatest(/^index-.*\.js$/i);
      const latestCss = pickLatest(/^index-.*\.css$/i);

      if (latestJs) {
        html = html.replace(/src="\/assets\/index-[^"]+\.js"/g, `src="/assets/${latestJs}"`);
      }
      if (latestCss) {
        html = html.replace(/href="\/assets\/index-[^"]+\.css"/g, `href="/assets/${latestCss}"`);
      }

      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(html);
    } catch (_e) {
      // As a fallback, serve the original file
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
