import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Serves `index.html` for `/business/:id` so refresh and deep links work in dev/preview. */
function qlistBusinessSpaFallback() {
  return {
    name: "qlist-business-spa-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url && req.url.split("?")[0]) || "";
        if (url.startsWith("/business/") && !url.split("/").pop().includes(".")) {
          req.url = "/index.html";
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url && req.url.split("?")[0]) || "";
        if (url.startsWith("/business/") && !url.split("/").pop().includes(".")) {
          req.url = "/index.html";
        }
        next();
      });
    },
  };
}

/** Serves `business-dashboard.html` for `/dashboard` and `/dashboard/…` (deep link + refresh). */
function qlistBusinessDashboardPathFallback() {
  function rewrite(req) {
    const raw = req.url || "";
    const pathPart = raw.split("?")[0] || "";
    const path = pathPart.replace(/\/$/, "") || "/";
    if (path === "/dashboard" || path.startsWith("/dashboard/")) {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      req.url = "/business-dashboard.html" + q;
    }
  }
  return {
    name: "qlist-business-dashboard-path-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

/** Serves `settings-placeholder.html` for `/settings/account`, `/settings/password`, etc. */
function qlistSettingsPathFallback() {
  var allowed = ["account", "password", "notifications", "billing"];
  function rewrite(req) {
    var raw = req.url || "";
    var pathPart = raw.split("?")[0] || "";
    var path = pathPart.replace(/\/$/, "") || "/";
    if (!path.startsWith("/settings/")) return;
    var seg = path.slice("/settings/".length).split("/")[0];
    if (!allowed.includes(seg)) return;
    var q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    req.url = "/settings-placeholder.html" + q;
  }
  return {
    name: "qlist-settings-path-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

/** Serves `explore.html` for `/explore` so `/explore?category=…` works in dev/preview. */
function qlistExplorePathFallback() {
  function rewrite(req) {
    const raw = req.url || "";
    const path = raw.split("?")[0] || "";
    if (path === "/explore" || path === "/explore/") {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      req.url = "/explore.html" + q;
    }
  }
  return {
    name: "qlist-explore-path-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

/** Serves `category.html` for `/category` (dedicated vertical category view). */
function qlistCategoryPathFallback() {
  function rewrite(req) {
    const raw = req.url || "";
    const path = raw.split("?")[0] || "";
    if (path === "/category" || path === "/category/") {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      req.url = "/category.html" + q;
    }
  }
  return {
    name: "qlist-category-path-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

/** Serves `search.html` for `/search` (unified category search results). */
function qlistSearchPathFallback() {
  function rewrite(req) {
    const raw = req.url || "";
    const path = raw.split("?")[0] || "";
    if (path === "/search" || path === "/search/") {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      req.url = "/search.html" + q;
    }
  }
  return {
    name: "qlist-search-path-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    qlistBusinessSpaFallback(),
    qlistBusinessDashboardPathFallback(),
    qlistSettingsPathFallback(),
    qlistExplorePathFallback(),
    qlistCategoryPathFallback(),
    qlistSearchPathFallback(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        explore: resolve(__dirname, "explore.html"),
        category: resolve(__dirname, "category.html"),
        search: resolve(__dirname, "search.html"),
        forBusiness: resolve(__dirname, "for-business.html"),
        businessDashboard: resolve(__dirname, "business-dashboard.html"),
        settingsPlaceholder: resolve(__dirname, "settings-placeholder.html"),
      },
    },
  },
});
