/**
 * Shared auth helpers for static QList pages (window.QListAuth).
 * Demo registry is seeded once so business vs consumer login can be tried without signup.
 */
(function (global) {
    var SESSION_KEY = "qlist-session";
    var REGISTRY_KEY = "qlist-user-registry";
    var REGISTRY_SEEDED = "qlist-user-registry-seeded-v1";

    function normalizeEmail(email) {
        return String(email || "")
            .trim()
            .toLowerCase();
    }

    function readJSON(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            var v = JSON.parse(raw);
            return v == null ? fallback : v;
        } catch (e) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function isQlistDevHost() {
        try {
            var loc = global.location;
            if (!loc) return false;
            var h = loc.hostname;
            var p = loc.port;
            return (
                h === "localhost" ||
                h === "127.0.0.1" ||
                h === "[::1]" ||
                (h && h.endsWith(".local")) ||
                p === "5173" ||
                p === "4173"
            );
        } catch (e) {
            return false;
        }
    }

    function isDevBusinessDashboardRelaxed() {
        var devFlag = false;
        try {
            devFlag = localStorage.getItem("dev") === "true";
        } catch (e) {}
        return isQlistDevHost() || devFlag;
    }

    /**
     * Development: any successful login becomes a business account so the dashboard is always usable.
     */
    function devPromoteRegistryUserToBusiness(norm) {
        if (!isDevBusinessDashboardRelaxed()) return;
        var registry = getRegistry();
        var row = registry[norm];
        if (!row) return;
        row.role = "business";
        if (!String(row.businessName || "").trim()) {
            row.businessName = "My business";
        }
        setRegistry(registry);
        writeSession({
            email: norm,
            role: "business",
            displayName: row.displayName || norm.split("@")[0],
            businessName: row.businessName || "My business",
            at: Date.now(),
        });
    }

    /**
     * Development / demo: seed the demo business session when there is no valid business session yet.
     * Runs on local/dev hosts, when localStorage "dev" is "true", or when localStorage "role" is "business".
     */
    function applyDevBusinessRoleBypass() {
        var devFlag = false;
        try {
            devFlag = localStorage.getItem("dev") === "true";
        } catch (e) {}
        var roleRaw = null;
        try {
            roleRaw = localStorage.getItem("role");
        } catch (e) {
            return false;
        }
        var allowBypass = isQlistDevHost() || devFlag || roleRaw === "business";
        if (!allowBypass) return false;
        var existing = readSession();
        if (existing && existing.role === "business") return true;
        ensureDemoRegistry();
        var reg = getRegistry();
        var row = reg["owner@qlist.demo"];
        if (!row || row.role !== "business") return false;
        var session = {
            email: "owner@qlist.demo",
            role: "business",
            displayName: row.displayName || "Jamie Rivera",
            businessName: row.businessName || "Northside Studio",
            at: Date.now(),
        };
        writeSession(session);
        return true;
    }

    function ensureDemoRegistry() {
        try {
            if (localStorage.getItem(REGISTRY_SEEDED)) return;
            var existing = readJSON(REGISTRY_KEY, {});
            if (existing && typeof existing === "object" && Object.keys(existing).length) {
                localStorage.setItem(REGISTRY_SEEDED, "1");
                return;
            }
            writeJSON(REGISTRY_KEY, {
                "owner@qlist.demo": {
                    password: "demo123",
                    role: "business",
                    displayName: "Jamie Rivera",
                    businessName: "Northside Studio",
                },
                "guest@qlist.demo": {
                    password: "demo123",
                    role: "user",
                    displayName: "Alex Chen",
                },
            });
            localStorage.setItem(REGISTRY_SEEDED, "1");
        } catch (e) {}
    }

    function getRegistry() {
        ensureDemoRegistry();
        var r = readJSON(REGISTRY_KEY, {});
        return r && typeof r === "object" ? r : {};
    }

    function setRegistry(registry) {
        writeJSON(REGISTRY_KEY, registry);
        try {
            localStorage.setItem(REGISTRY_SEEDED, "1");
        } catch (e) {}
    }

    function readSession() {
        var s = readJSON(SESSION_KEY, null);
        if (!s || typeof s !== "object") return null;
        if (!s.email || !s.role) return null;
        return s;
    }

    function writeSession(session) {
        writeJSON(SESSION_KEY, session);
        try {
            if (session && session.role) localStorage.setItem("role", session.role);
            else localStorage.removeItem("role");
        } catch (e) {}
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem("role");
        } catch (e) {}
    }

    function registerUser(entry) {
        var email = normalizeEmail(entry.email);
        if (!email) return { ok: false, error: "Email is required." };
        var registry = getRegistry();
        if (registry[email]) return { ok: false, error: "An account with this email already exists." };
        var role = entry.role === "business" ? "business" : "user";
        registry[email] = {
            password: String(entry.password || ""),
            role: role,
            displayName: String(entry.displayName || "").trim() || email.split("@")[0],
            businessName:
                role === "business"
                    ? String(entry.businessName || "").trim() || "My business"
                    : "",
        };
        setRegistry(registry);
        return { ok: true };
    }

    function loginWithEmailPassword(email, password) {
        var norm = normalizeEmail(email);
        if (!norm) return { ok: false, error: "Enter your email." };
        if (!password) return { ok: false, error: "Enter your password." };
        var registry = getRegistry();
        var row = registry[norm];
        if (!row) return { ok: false, error: "No account found for that email. Sign up first." };
        if (row.password !== String(password))
            return { ok: false, error: "Incorrect password." };
        var role = row.role === "business" ? "business" : "user";
        var session = {
            email: norm,
            role: role,
            displayName: row.displayName || norm.split("@")[0],
            businessName: role === "business" ? row.businessName || "My business" : "",
            at: Date.now(),
        };
        writeSession(session);
        devPromoteRegistryUserToBusiness(norm);
        session = readSession() || session;
        return { ok: true, session: session };
    }

    /**
     * Upgrade a signed-in consumer account to a business owner (demo/local registry).
     * Updates registry row and current session.
     */
    function promoteToBusiness(businessName) {
        var s = readSession();
        if (!s || !s.email) return { ok: false, error: "Not signed in." };
        var norm = normalizeEmail(s.email);
        var registry = getRegistry();
        var row = registry[norm];
        if (!row) return { ok: false, error: "Account not found." };
        var bn = String(businessName || "").trim() || row.businessName || "My business";
        row.role = "business";
        row.businessName = bn;
        setRegistry(registry);
        var news = {
            email: norm,
            role: "business",
            displayName: row.displayName || norm.split("@")[0],
            businessName: bn,
            at: Date.now(),
        };
        writeSession(news);
        return { ok: true, session: news };
    }

    /** Persist public-facing business name for the signed-in account (registry + session). */
    function updateBusinessName(businessName) {
        var s = readSession();
        if (!s || !s.email) return { ok: false, error: "Not signed in." };
        var norm = normalizeEmail(s.email);
        var registry = getRegistry();
        var row = registry[norm];
        if (!row) return { ok: false, error: "Account not found." };
        var bn = String(businessName || "").trim() || row.businessName || "My business";
        row.businessName = bn;
        setRegistry(registry);
        var news = {
            email: norm,
            role: s.role,
            displayName: s.displayName,
            businessName: s.role === "business" ? bn : s.businessName || "",
            at: Date.now(),
        };
        writeSession(news);
        return { ok: true, session: news };
    }

    global.QListAuth = {
        SESSION_KEY: SESSION_KEY,
        REGISTRY_KEY: REGISTRY_KEY,
        normalizeEmail: normalizeEmail,
        readSession: readSession,
        writeSession: writeSession,
        clearSession: clearSession,
        getRegistry: getRegistry,
        registerUser: registerUser,
        loginWithEmailPassword: loginWithEmailPassword,
        promoteToBusiness: promoteToBusiness,
        updateBusinessName: updateBusinessName,
        ensureDemoRegistry: ensureDemoRegistry,
        isQlistDevHost: isQlistDevHost,
        applyDevBusinessRoleBypass: applyDevBusinessRoleBypass,
    };
})(typeof window !== "undefined" ? window : this);
