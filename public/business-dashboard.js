/**
 * Business owner dashboard — separate from the consumer homepage.
 * Persists services and per-service schedules under qlist-business-data:<email>.
 */
(function () {
    var DAYS = [
        { key: "mon", label: "Monday" },
        { key: "tue", label: "Tuesday" },
        { key: "wed", label: "Wednesday" },
        { key: "thu", label: "Thursday" },
        { key: "fri", label: "Friday" },
        { key: "sat", label: "Saturday" },
        { key: "sun", label: "Sunday" },
    ];

    function pad2(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function toISODate(d) {
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    }

    /** Local date → schedule day key */
    function dateToDayKey(d) {
        var js = d.getDay();
        var map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        return map[js];
    }

    function startOfWeekMonday(d) {
        var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        var day = (x.getDay() + 6) % 7;
        x.setDate(x.getDate() - day);
        return x;
    }

    function addDays(d, n) {
        var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        x.setDate(x.getDate() + n);
        return x;
    }

    function sameLocalDate(a, b) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    function parseHMToMinutes(s) {
        var p = String(s || "09:00").split(":");
        var h = parseInt(p[0], 10);
        var m = parseInt(p[1] != null ? p[1] : "0", 10);
        if (isNaN(h) || isNaN(m)) return 9 * 60;
        return h * 60 + m;
    }

    function minutesToHM(mins) {
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return pad2(h) + ":" + pad2(m);
    }

    /**
     * Candidate start times for a service on one day: step equals service duration;
     * each slot [t, t + duration) must fit inside working hours [start, end).
     */
    function buildSlotsForDay(startStr, endStr, serviceDurationMin) {
        var slots = [];
        var a = parseHMToMinutes(startStr);
        var b = parseHMToMinutes(endStr);
        var step = serviceDurationMin > 0 ? serviceDurationMin : 30;
        for (var t = a; t + step <= b; t += step) {
            slots.push(minutesToHM(t));
        }
        return slots;
    }

    function serviceDurationForBooking(b, services) {
        var dur = 30;
        if (b.serviceId) {
            var svc = services.find(function (s) {
                return s.id === b.serviceId;
            });
            if (svc && svc.durationMin > 0) dur = svc.durationMin;
        } else if (b.service && services.length) {
            var sv2 = services.find(function (s) {
                return String(s.name) === String(b.service);
            });
            if (sv2 && sv2.durationMin > 0) dur = sv2.durationMin;
        }
        return dur;
    }

    /** Ensure start_time / end_time (as startTime, endTime HH:mm) for overlap checks and persistence. */
    function hydrateBookingTimeRange(bookings, services) {
        if (!Array.isArray(bookings)) return;
        bookings.forEach(function (b) {
            if (b.startTime && b.endTime) return;
            if (!b.time) return;
            var startMin = parseHMToMinutes(b.time);
            var dur = serviceDurationForBooking(b, services);
            b.startTime = b.time;
            b.endTime = minutesToHM(startMin + dur);
        });
    }

    /** Interval in minutes for a booking on the calendar (legacy `time` + service duration, or explicit range). */
    function getBookingIntervalMinutes(b, services) {
        if (!b.date) return null;
        if (b.startTime && b.endTime) {
            var s0 = parseHMToMinutes(b.startTime);
            var e0 = parseHMToMinutes(b.endTime);
            if (e0 <= s0) e0 = s0 + serviceDurationForBooking(b, services);
            return { start: s0, end: e0 };
        }
        if (!b.time) return null;
        var sm = parseHMToMinutes(b.time);
        return { start: sm, end: sm + serviceDurationForBooking(b, services) };
    }

    function seedDemoBookings(services) {
        if (!services.length) return [];
        var s0 = services[0];
        var s1 = services.length > 1 ? services[1] : services[0];
        var today = new Date();
        var t0 = toISODate(today);
        var t1 = toISODate(addDays(today, 1));
        var t2 = toISODate(addDays(today, 2));
        var pastA = toISODate(addDays(today, -5));
        var pastB = toISODate(addDays(today, -14));
        var pastC = toISODate(addDays(today, -72));
        return [
            {
                when: "Today · 9:15 AM",
                client: "Jordan Lee",
                service: s0.name,
                serviceId: s0.id,
                date: t0,
                time: "09:15",
                status: "completed",
            },
            {
                when: "Today · 11:00 AM",
                client: "Priya Desai",
                service: s1.name,
                serviceId: s1.id,
                date: t0,
                time: "11:00",
                status: "scheduled",
            },
            {
                when: "Today · 2:00 PM",
                client: "Sam Rivera",
                service: s0.name,
                serviceId: s0.id,
                date: t0,
                time: "14:00",
                status: "scheduled",
            },
            {
                when: "Today · 4:30 PM",
                client: "Marcus Chen",
                service: s1.name,
                serviceId: s1.id,
                date: t0,
                time: "16:30",
                status: "scheduled",
            },
            {
                when: "Tomorrow · 9:00 AM",
                client: "Alex Kim",
                service: s0.name,
                serviceId: s0.id,
                date: t1,
                time: "09:00",
                status: "scheduled",
            },
            {
                when: "",
                client: "Riley Ortiz",
                service: s1.name,
                serviceId: s1.id,
                date: t2,
                time: "13:30",
                status: "scheduled",
            },
            {
                when: "",
                client: "Casey Morgan",
                service: s1.name,
                serviceId: s1.id,
                date: pastA,
                time: "10:00",
                status: "completed",
            },
            {
                when: "",
                client: "Taylor Brooks",
                service: s0.name,
                serviceId: s0.id,
                date: pastB,
                time: "15:30",
                status: "completed",
            },
            {
                when: "",
                client: "Jamie Wu",
                service: s0.name,
                serviceId: s0.id,
                date: pastC,
                time: "11:00",
                status: "completed",
            },
        ];
    }

    function $(sel, root) {
        return (root || document).querySelector(sel);
    }

    function $all(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    function auth() {
        return window.QListAuth;
    }

    function storageKey(email) {
        var a = auth();
        return "qlist-business-data:" + (a && a.normalizeEmail ? a.normalizeEmail(email) : String(email || "").toLowerCase());
    }

    function defaultDay() {
        return { enabled: true, start: "09:00", end: "17:00" };
    }

    function defaultSchedule() {
        var s = {};
        DAYS.forEach(function (d) {
            var copy = defaultDay();
            if (d.key === "sun") copy.enabled = false;
            s[d.key] = copy;
        });
        return s;
    }

    function uid() {
        return "svc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function listingId() {
        return "lst_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function staffUid() {
        return "stf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    /** @type {string} */
    var staffModalDraftPhoto = "";

    function normalizeDashboardStaffFromRaw(arr, services) {
        if (!Array.isArray(arr) || !arr.length) return [];
        var valid = {};
        (services || []).forEach(function (s) {
            if (s && s.id) valid[s.id] = true;
        });
        return arr.map(function (m) {
            var x = m && typeof m === "object" ? Object.assign({}, m) : {};
            if (!x.id || typeof x.id !== "string") x.id = staffUid();
            x.name = String(x.name || "").trim() || "Professional";
            x.role = String(x.role || "").trim();
            x.description = String(x.description || "").trim();
            x.photo = String(x.photo || "").trim();
            var ids = Array.isArray(x.serviceIds) ? x.serviceIds : [];
            x.serviceIds = ids.map(String).filter(function (sid) {
                return valid[sid];
            });
            x.bookable = x.bookable !== false;
            return x;
        });
    }

    function listingHasContent(L) {
        if (!L || typeof L !== "object") return false;
        return !!(
            (L.businessName && String(L.businessName).trim()) ||
            (L.description && String(L.description).trim()) ||
            (L.location && String(L.location).trim()) ||
            (L.services && String(L.services).trim()) ||
            (L.images && L.images.length)
        );
    }

    /** Structured services stored on each listing for multi-location dashboard data. */
    function normalizeDashboardServicesFromRaw(arr) {
        if (!Array.isArray(arr) || !arr.length) return [];
        return arr.map(function (svc) {
            var s = svc && typeof svc === "object" ? Object.assign({}, svc) : {};
            if (!s.id || typeof s.id !== "string") s.id = uid();
            s.name = String(s.name || "Service").trim() || "Service";
            var d = parseInt(s.durationMin, 10);
            s.durationMin = isNaN(d) || d <= 0 ? 30 : d;
            s.price = s.price != null && s.price !== "" ? String(s.price) : "";
            if (!s.schedule || typeof s.schedule !== "object") s.schedule = defaultSchedule();
            else {
                DAYS.forEach(function (day) {
                    if (!s.schedule[day.key]) s.schedule[day.key] = defaultDay();
                });
            }
            return s;
        });
    }

    function normalizeListing(raw) {
        var o = raw && typeof raw === "object" ? raw : {};
        var imgs = o.images;
        if (!Array.isArray(imgs)) imgs = [];
        imgs = imgs
            .map(function (x) {
                return typeof x === "string" ? x.trim() : "";
            })
            .filter(function (t) {
                if (!t || t.length > 4096) return false;
                if (t.indexOf("data:image/") === 0) return true;
                if (/^https?:\/\//i.test(t)) return true;
                return false;
            });
        var out = {
            businessName: String(o.businessName || "").trim(),
            description: String(o.description || "").trim(),
            services: String(o.services || "").trim(),
            location: String(o.location || "").trim(),
            images: imgs.slice(0, 6),
        };
        if (o.id && typeof o.id === "string") out.id = o.id;
        if (
            Array.isArray(o.dashboardServices) &&
            o.dashboardServices.length &&
            o.dashboardServices[0] &&
            typeof o.dashboardServices[0] === "object"
        ) {
            out.dashboardServices = normalizeDashboardServicesFromRaw(o.dashboardServices);
        }
        if (Array.isArray(o.dashboardBookings) && o.dashboardBookings.length) {
            out.dashboardBookings = o.dashboardBookings.map(function (b) {
                return b && typeof b === "object" ? Object.assign({}, b) : {};
            });
            ensureBookingIds(out.dashboardBookings);
        }
        if (Array.isArray(o.readOpportunityIds)) {
            out.readOpportunityIds = o.readOpportunityIds.filter(function (x) {
                return typeof x === "string" && x;
            });
        } else {
            out.readOpportunityIds = [];
        }
        out.staffSectionEnabled = o.staffSectionEnabled === true;
        out.staffBookingEnabled = o.staffBookingEnabled === true;
        out.staffSectionTitle = String(o.staffSectionTitle || "").trim() || "Staff";
        var svcForStaff = out.dashboardServices && out.dashboardServices.length ? out.dashboardServices : [];
        if (Array.isArray(o.dashboardStaff) && o.dashboardStaff.length) {
            out.dashboardStaff = normalizeDashboardStaffFromRaw(o.dashboardStaff, svcForStaff);
        } else {
            out.dashboardStaff = [];
        }
        return out;
    }

    /** Stock covers for seeded demo listings (also used to backfill older saved state). */
    var DEMO_LISTING_COVER_NORTHSIDE =
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80";
    var DEMO_LISTING_COVER_BARBER =
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=80";

    function backfillDemoListingCoverIfNeeded(L) {
        if (!L || typeof L !== "object") return false;
        if (Array.isArray(L.images) && L.images.length) return false;
        var n = String(L.businessName || "").trim();
        if (n === "Northside Studio") {
            L.images = [DEMO_LISTING_COVER_NORTHSIDE];
            return true;
        }
        if (n === "Barber Pro") {
            L.images = [DEMO_LISTING_COVER_BARBER];
            return true;
        }
        return false;
    }

    function buildDemoListingNorthside() {
        var s1 = {
            id: uid(),
            name: "Private session",
            durationMin: 60,
            price: "90",
            schedule: defaultSchedule(),
        };
        var s2 = {
            id: uid(),
            name: "90-minute class",
            durationMin: 90,
            price: "45",
            schedule: defaultSchedule(),
        };
        var bookings = seedDemoBookings([s1, s2]);
        ensureBookingIds(bookings);
        return normalizeListing({
            id: listingId(),
            businessName: "Northside Studio",
            description: "Movement and mindfulness in a bright northside studio.",
            services: "Private session — 60 min\n90-minute class — 90 min",
            location: "North Portland, OR",
            images: [DEMO_LISTING_COVER_NORTHSIDE],
            dashboardServices: [s1, s2],
            dashboardBookings: bookings,
        });
    }

    function buildDemoListingBarberPro() {
        var s1 = {
            id: uid(),
            name: "Classic cut",
            durationMin: 30,
            price: "35",
            schedule: defaultSchedule(),
        };
        var s2 = {
            id: uid(),
            name: "Cut & style",
            durationMin: 45,
            price: "55",
            schedule: defaultSchedule(),
        };
        var bookings = seedDemoBookings([s1, s2]);
        ensureBookingIds(bookings);
        return normalizeListing({
            id: listingId(),
            businessName: "Barber Pro",
            description: "Sharp cuts and hot-towel finishes, walk-ins welcome.",
            services: "Classic cut — 30 min\nCut & style — 45 min",
            location: "Alberta Arts District, Portland, OR",
            images: [DEMO_LISTING_COVER_BARBER],
            dashboardServices: [s1, s2],
            dashboardBookings: bookings,
        });
    }

    function flushOperationalDataToActiveListing(state) {
        if (!state || !state.activeListingId || !Array.isArray(state.listings)) return;
        var L = state.listings.find(function (l) {
            return l.id === state.activeListingId;
        });
        if (!L || !listingHasContent(L)) return;
        try {
            L.dashboardServices = JSON.parse(JSON.stringify(state.services || []));
            L.dashboardBookings = JSON.parse(JSON.stringify(state.upcomingBookings || []));
            L.dashboardStaff = JSON.parse(JSON.stringify(state.staff || []));
            L.staffSectionEnabled = !!state.staffSectionEnabled;
            L.staffBookingEnabled = !!state.staffBookingEnabled;
            L.staffSectionTitle = state.staffSectionTitle || "Staff";
        } catch (e) {}
    }

    function applyDashboardDataFromActiveListing(state) {
        var L = state.listing;
        if (!L || !listingHasContent(L)) return;
        if (Array.isArray(L.dashboardServices) && L.dashboardServices.length) {
            state.services = normalizeDashboardServicesFromRaw(L.dashboardServices);
        }
        state.staff = normalizeDashboardStaffFromRaw(L.dashboardStaff || [], state.services || []);
        state.staffSectionEnabled = L.staffSectionEnabled === true;
        state.staffBookingEnabled = L.staffBookingEnabled === true;
        state.staffSectionTitle = L.staffSectionTitle || "Staff";
        if (Array.isArray(L.dashboardBookings) && L.dashboardBookings.length) {
            var copy = L.dashboardBookings.map(function (b) {
                return Object.assign({}, b);
            });
            copy.forEach(function (b) {
                if (b.status !== "completed" && b.status !== "scheduled") b.status = "scheduled";
                if (!b.status) b.status = "scheduled";
            });
            ensureBookingIds(copy);
            hydrateBookingTimeRange(copy, state.services);
            state.upcomingBookings = copy;
        } else if (Array.isArray(L.dashboardServices) && L.dashboardServices.length) {
            state.upcomingBookings = seedDemoBookings(state.services);
            ensureBookingIds(state.upcomingBookings);
            hydrateBookingTimeRange(state.upcomingBookings, state.services);
        }
    }

    function loadState(email) {
        var key = storageKey(email);
        var raw = null;
        try {
            raw = localStorage.getItem(key);
        } catch (e) {}
        var parsed = null;
        try {
            parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
            parsed = null;
        }
        if (!parsed || typeof parsed !== "object") parsed = {};

        var listings = [];
        if (Array.isArray(parsed.listings) && parsed.listings.length) {
            for (var li = 0; li < parsed.listings.length; li++) {
                listings.push(normalizeListing(parsed.listings[li]));
            }
        } else {
            var legacy = normalizeListing(parsed.listing);
            if (listingHasContent(legacy)) {
                if (!legacy.id) legacy.id = listingId();
                listings.push(legacy);
            }
        }
        for (var lj = 0; lj < listings.length; lj++) {
            if (!listings[lj].id) listings[lj].id = listingId();
        }

        var didBackfillDemoCovers = false;
        for (var lb = 0; lb < listings.length; lb++) {
            if (backfillDemoListingCoverIfNeeded(listings[lb])) didBackfillDemoCovers = true;
        }

        var filledPreSeed = listings.filter(listingHasContent);
        var didSeedDemoListings = false;
        if (!filledPreSeed.length) {
            listings.push(buildDemoListingNorthside(), buildDemoListingBarberPro());
            didSeedDemoListings = true;
        }

        var activeListingId = typeof parsed.activeListingId === "string" ? parsed.activeListingId : null;
        var activeObj = null;
        for (var lk = 0; lk < listings.length; lk++) {
            if (activeListingId && listings[lk].id === activeListingId) {
                activeObj = listings[lk];
                break;
            }
        }
        if (!activeObj && listings.length === 1) activeObj = listings[0];

        var listing = activeObj ? activeObj : normalizeListing(null);

        var services = [];
        if (activeObj && Array.isArray(activeObj.dashboardServices) && activeObj.dashboardServices.length) {
            services = normalizeDashboardServicesFromRaw(activeObj.dashboardServices);
        } else {
            services = Array.isArray(parsed.services) ? parsed.services : [];
            if (!services.length) {
                services = [
                    {
                        id: uid(),
                        name: "Intro consultation",
                        durationMin: 30,
                        price: "85",
                        schedule: defaultSchedule(),
                    },
                ];
            } else {
                services = services.map(function (svc) {
                    if (!svc.schedule || typeof svc.schedule !== "object") svc.schedule = defaultSchedule();
                    return svc;
                });
            }
        }

        var upcomingBookings = [];
        if (activeObj && Array.isArray(activeObj.dashboardBookings) && activeObj.dashboardBookings.length) {
            upcomingBookings = activeObj.dashboardBookings.map(function (b) {
                return Object.assign({}, b);
            });
        } else {
            upcomingBookings = Array.isArray(parsed.upcomingBookings) ? parsed.upcomingBookings : [];
            if (!("upcomingBookings" in parsed) || !upcomingBookings.length) {
                upcomingBookings = seedDemoBookings(services);
            }
        }
        upcomingBookings.forEach(function (b) {
            if (b.status !== "completed" && b.status !== "scheduled") b.status = "scheduled";
            if (!b.status) b.status = "scheduled";
        });
        ensureBookingIds(upcomingBookings);
        hydrateBookingTimeRange(upcomingBookings, services);

        var staff = [];
        var staffSectionEnabled = false;
        var staffBookingEnabled = false;
        var staffSectionTitle = "Staff";
        if (activeObj) {
            staff = normalizeDashboardStaffFromRaw(activeObj.dashboardStaff || [], services);
            staffSectionEnabled = activeObj.staffSectionEnabled === true;
            staffBookingEnabled = activeObj.staffBookingEnabled === true;
            staffSectionTitle = String(activeObj.staffSectionTitle || "").trim() || "Staff";
        }

        var out = {
            services: services,
            upcomingBookings: upcomingBookings,
            listings: listings,
            activeListingId: activeObj ? activeObj.id : null,
            listing: listing,
            staff: staff,
            staffSectionEnabled: staffSectionEnabled,
            staffBookingEnabled: staffBookingEnabled,
            staffSectionTitle: staffSectionTitle,
        };

        if (didSeedDemoListings || didBackfillDemoCovers) {
            try {
                saveState(email, out);
            } catch (eSave) {}
        }

        return out;
    }

    function saveState(email, state) {
        flushOperationalDataToActiveListing(state);
        try {
            var payload = {
                services: state.services,
                upcomingBookings: state.upcomingBookings,
                listings: Array.isArray(state.listings) ? state.listings : [],
                activeListingId: state.activeListingId != null ? state.activeListingId : null,
            };
            localStorage.setItem(storageKey(email), JSON.stringify(payload));
        } catch (e) {}
    }

    function hideListingPicker() {
        var root = $("#bd-listing-picker");
        if (!root) return;
        root.classList.add("hidden");
        root.setAttribute("aria-hidden", "true");
        document.body.classList.remove("bd-listing-picker-open");
    }

    /** Per-tab session: after user picks a listing once, skip picker on refresh until log out. */
    function listingPickerSessionStorageKey(businessEmail) {
        return "bd_dash_listing_pick_" + String(businessEmail || "").toLowerCase();
    }

    function listingPickerFirstImageUrl(L) {
        var imgs = L && L.images;
        if (!Array.isArray(imgs) || !imgs.length) return "";
        for (var i = 0; i < imgs.length; i++) {
            var u = typeof imgs[i] === "string" ? imgs[i].trim() : "";
            if (!u) continue;
            if (u.indexOf("data:image/") === 0 || /^https?:\/\//i.test(u)) return u;
        }
        return "";
    }

    function listingPickerPlaceholderThumbHtml() {
        return (
            '<div class="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted via-muted/55 to-muted/30">' +
            '<div class="absolute inset-[18%] rounded-2xl border border-border/40 bg-card/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[2px]"></div>' +
            '<div class="relative flex h-full w-full items-center justify-center text-muted-foreground/50">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" class="h-[3.25rem] w-[3.25rem] shrink-0" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M10 46V24l9-7 9 7 9-7 9 7v22H10z"/>' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M19 46V33h7v13"/>' +
            "</svg></div></div>"
        );
    }

    function listingPickerImageThumbHtml(url) {
        return (
            '<div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">' +
            '<img src="' +
            escapeAttr(url) +
            '" alt="" class="h-full w-full object-cover object-center transition-[transform] duration-300 ease-out group-hover:motion-safe:scale-[1.02]" loading="lazy" decoding="async" />' +
            "</div>"
        );
    }

    function showListingPicker(state, persist, onChosen, businessEmail) {
        var root = $("#bd-listing-picker");
        var grid = $("#bd-listing-picker-grid");
        if (!root || !grid) {
            if (typeof onChosen === "function") onChosen();
            return;
        }
        var filled = (state.listings || []).filter(listingHasContent);
        grid.innerHTML = "";
        filled.forEach(function (L) {
            var id = L.id;
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className =
                "group flex w-full max-w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06),0_6px_20px_-8px_rgba(15,23,42,0.08)] transition-[transform,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-1 hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.1),0_4px_14px_-4px_rgba(15,23,42,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
            btn.setAttribute("data-bd-picker-listing-id", id);
            var coverUrl = listingPickerFirstImageUrl(L);
            var thumb = coverUrl ? listingPickerImageThumbHtml(coverUrl) : listingPickerPlaceholderThumbHtml();
            var loc = L.location && String(L.location).trim();
            btn.setAttribute(
                "aria-label",
                "Open dashboard for " + (L.businessName && String(L.businessName).trim() ? L.businessName.trim() : "this business")
            );
            btn.innerHTML =
                thumb +
                '<div class="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3.5">' +
                '<span class="text-[0.9375rem] font-semibold leading-snug tracking-tight text-foreground">' +
                escapeHtml(L.businessName || "Untitled") +
                "</span>" +
                '<span class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">' +
                (loc ? escapeHtml(loc) : '<span class="text-muted-foreground/65">Location not set</span>') +
                "</span></div>";
            btn.addEventListener("click", function () {
                state.activeListingId = id;
                state.listing = state.listings.find(function (x) {
                    return x.id === id;
                }) || state.listing;
                applyDashboardDataFromActiveListing(state);
                persist();
                try {
                    if (businessEmail) {
                        sessionStorage.setItem(listingPickerSessionStorageKey(businessEmail), "1");
                    }
                } catch (ePick) {}
                hideListingPicker();
                if (typeof onChosen === "function") onChosen();
            });
            grid.appendChild(btn);
        });
        root.classList.remove("hidden");
        root.setAttribute("aria-hidden", "false");
        document.body.classList.add("bd-listing-picker-open");
    }

    function resolveListingSelection(state, persist, done, businessEmail) {
        if (!Array.isArray(state.listings)) state.listings = [];
        var filled = state.listings.filter(listingHasContent);
        if (filled.length <= 1) {
            if (filled.length === 1) {
                state.activeListingId = filled[0].id;
                state.listing = state.listings.find(function (l) {
                    return l.id === filled[0].id;
                }) || filled[0];
                applyDashboardDataFromActiveListing(state);
                persist();
            } else {
                state.activeListingId = null;
                state.listing = normalizeListing(null);
            }
            done();
            return;
        }
        var activeOk =
            state.activeListingId &&
            filled.some(function (l) {
                return l.id === state.activeListingId;
            });
        var pickedThisBrowserSession = false;
        try {
            pickedThisBrowserSession =
                sessionStorage.getItem(listingPickerSessionStorageKey(businessEmail)) === "1";
        } catch (eSess) {}
        if (activeOk && pickedThisBrowserSession) {
            state.listing =
                state.listings.find(function (l) {
                    return l.id === state.activeListingId;
                }) || filled[0];
            applyDashboardDataFromActiveListing(state);
            done();
            return;
        }
        showListingPicker(state, persist, done, businessEmail);
    }

    /** Set true in init for business accounts (listing nav + form). */
    var dashboardSessionIsBusiness = false;

    /** Filled after init so setActiveNav can open listing routes. */
    var listingRouteHooks = {
        onEnterAddListing: null,
        onEnterMyListings: null,
    };

    var DASHBOARD_ROUTE_KEYS = {
        home: true,
        overview: true,
        insights: true,
        services: true,
        staff: true,
        schedule: true,
        bookings: true,
        earnings: true,
        "my-listings": true,
        "add-listing": true,
    };

    /** Main panels that use the home-card / deep-link enter transition. */
    var BD_PANEL_ENTER_ROUTES = {
        earnings: true,
        insights: true,
        schedule: true,
        services: true,
        staff: true,
        bookings: true,
    };

    function bdPrefersReducedMotion() {
        try {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch (eRm) {
            return false;
        }
    }

    function stripBdPanelPageEnterClass() {
        $all("section[data-bd-panel].bd-panel-page-enter").forEach(function (p) {
            p.classList.remove("bd-panel-page-enter");
        });
    }

    function runBdPanelPageEnterAnim(panelId) {
        if (!BD_PANEL_ENTER_ROUTES[panelId]) return;
        if (bdPrefersReducedMotion()) return;
        var el = document.querySelector('[data-bd-panel="' + panelId + '"]');
        if (!el || el.hidden) return;
        el.classList.remove("bd-panel-page-enter");
        void el.offsetWidth;
        el.classList.add("bd-panel-page-enter");
        var onEnd = function (ev) {
            if (ev.target !== el) return;
            if (ev.animationName !== "bd-panel-page-enter") return;
            el.removeEventListener("animationend", onEnd);
            el.classList.remove("bd-panel-page-enter");
        };
        el.addEventListener("animationend", onEnd);
    }

    function panelForRoute(route) {
        if (route === "home") return "home";
        if (route === "schedule") return "schedule";
        if (route === "services") return "services";
        if (route === "staff") return "staff";
        if (route === "my-listings") return "my-listings";
        if (route === "add-listing") return "add-listing";
        if (route === "insights") return "insights";
        if (route === "bookings") return "bookings";
        if (route === "earnings") return "earnings";
        if (route === "overview") return "overview";
        return "home";
    }

    function normalizePathname() {
        try {
            return (window.location.pathname || "").replace(/\/+$/, "") || "/";
        } catch (e) {
            return "/";
        }
    }

    function pathIsBusinessDashboardFile(p) {
        return /\/business-dashboard\.html$/i.test(p);
    }

    function pathIsUnderDashboard(p) {
        return p === "/dashboard" || /^\/dashboard\//.test(p);
    }

    /** URL path for a dashboard section (Vite / static host with `/dashboard` rewrite). */
    function pathForDashboardRoute(raw) {
        if (!raw || raw === "home") return "/dashboard";
        if (raw === "overview") return "/dashboard/overview";
        return "/dashboard/" + raw;
    }

    function usePathBasedDashboardUrls() {
        return pathIsUnderDashboard(normalizePathname());
    }

    /** Update address bar to match `raw` without reloading when possible. */
    function applyDashboardUrl(raw) {
        var key = raw && DASHBOARD_ROUTE_KEYS[raw] ? raw : "home";
        var target = pathForDashboardRoute(key);
        if (usePathBasedDashboardUrls()) {
            try {
                history.pushState(null, "", target);
                return;
            } catch (e1) {}
        }
        if (pathIsBusinessDashboardFile(normalizePathname())) {
            try {
                window.location.hash = "#" + key;
            } catch (e2) {}
            return;
        }
        try {
            window.location.hash = "#" + key;
        } catch (e3) {}
    }

    /** Current dashboard view: `/dashboard`, `/dashboard/insights`, … or `#segment` on `business-dashboard.html`. */
    function getRouteRaw() {
        var path = normalizePathname();
        if (path === "/dashboard") return "home";
        var dm = /^\/dashboard\/([^/]+)$/.exec(path);
        if (dm) {
            var seg = dm[1];
            if (DASHBOARD_ROUTE_KEYS[seg]) return seg;
            return "home";
        }
        if (pathIsBusinessDashboardFile(path)) {
            var h = "";
            try {
                h = (window.location.hash || "").replace(/^#/, "");
            } catch (eH) {}
            if (h && DASHBOARD_ROUTE_KEYS[h]) return h;
            return "home";
        }
        var h2 = "";
        try {
            h2 = (window.location.hash || "").replace(/^#/, "");
        } catch (eH2) {}
        if (h2 && DASHBOARD_ROUTE_KEYS[h2]) return h2;
        return "home";
    }

    function setActiveNav(explicit) {
        var raw =
            explicit != null && String(explicit) !== ""
                ? String(explicit).replace(/^#/, "") || "home"
                : getRouteRaw();
        var panel = panelForRoute(raw);
        $all("[data-bd-nav]").forEach(function (btn) {
            var id = btn.getAttribute("data-bd-nav");
            var on = id === raw;
            btn.classList.toggle("bd-nav__btn--active", on);
            btn.setAttribute("aria-current", on ? "page" : "false");
        });
        var backBtn = $("#bd-back-to-dashboard");
        if (backBtn) {
            var pathNow = normalizePathname();
            // Path URLs: hide only on `/dashboard` (cards home); show on `/dashboard/…`.
            // File + hash URLs: hide when logical route is `home`.
            var onDashboardHome = pathIsUnderDashboard(pathNow)
                ? pathNow === "/dashboard"
                : raw === "home";
            if (onDashboardHome) {
                backBtn.setAttribute("hidden", "");
            } else {
                backBtn.removeAttribute("hidden");
            }
        }
        $all("[data-bd-panel]").forEach(function (p) {
            var id = p.getAttribute("data-bd-panel");
            p.hidden = id !== panel;
        });
        stripBdPanelPageEnterClass();
        if (BD_PANEL_ENTER_ROUTES[raw]) {
            window.requestAnimationFrame(function () {
                runBdPanelPageEnterAnim(panel);
            });
        }
        var title = $("#bd-page-title");
        if (title) {
            var labels = {
                home: "Dashboard",
                overview: "Overview",
                services: "Services",
                staff: "Staff",
                bookings: "Bookings",
                schedule: "Schedule",
                insights: "Insights",
                earnings: "Earnings",
                "my-listings": "My listings",
                "add-listing": "Add new listing",
            };
            title.textContent = labels[raw] || "Dashboard";
        }
        var mainEl = $(".bd-main");
        if (mainEl) mainEl.scrollTop = 0;
        try {
            window.scrollTo(0, 0);
        } catch (eScroll) {}
        if (raw === "add-listing" && listingRouteHooks.onEnterAddListing) {
            listingRouteHooks.onEnterAddListing();
        }
        if (raw === "my-listings" && listingRouteHooks.onEnterMyListings) {
            listingRouteHooks.onEnterMyListings();
        }
    }

    function bookingIsCompleted(b) {
        return b.status === "completed";
    }

    /** HH:mm for booking lists (24h). */
    function formatTime24h(timeStr) {
        var p = String(timeStr || "").split(":");
        var h = parseInt(p[0], 10);
        var m = parseInt(p[1] != null ? p[1] : "0", 10);
        if (isNaN(h)) return timeStr || "—";
        var h24 = ((h % 24) + 24) % 24;
        var mm = pad2(isNaN(m) ? 0 : m);
        return pad2(h24) + ":" + mm;
    }

    /** e.g. "Sat 18 Apr" for grouped upcoming lists. */
    function formatBookingsDateHeading(iso) {
        var p = String(iso || "").split("-");
        if (p.length !== 3) return iso || "";
        var y = parseInt(p[0], 10);
        var mo = parseInt(p[1], 10) - 1;
        var dayNum = parseInt(p[2], 10);
        if (isNaN(y) || isNaN(mo) || isNaN(dayNum)) return iso || "";
        var d = new Date(y, mo, dayNum);
        var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        try {
            return weekdays[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()];
        } catch (e) {
            return iso || "";
        }
    }

    function compareBookingTime(a, b) {
        var ta = a.time || "00:00";
        var tb = b.time || "00:00";
        return ta.localeCompare(tb);
    }

    /**
     * One shared calendar: any scheduled booking on this date blocks the slot for every service.
     * Completed appointments do not block new bookings.
     */
    function slotBlockedByBookings(dateISO, slotHM, proposedDurationMin, bookings, services) {
        var ps = parseHMToMinutes(slotHM);
        var pe = ps + proposedDurationMin;
        var list = bookings || [];
        for (var i = 0; i < list.length; i++) {
            var b = list[i];
            if (b.date !== dateISO) continue;
            if (bookingIsCompleted(b)) continue;
            var iv = getBookingIntervalMinutes(b, services);
            if (!iv) continue;
            if (ps < iv.end && iv.start < pe) return true;
        }
        return false;
    }

    function renderTodayOverview(state) {
        var todayISO = toISODate(new Date());
        var list = state.upcomingBookings || [];
        var totalToday = 0;
        var upcoming = 0;
        var completedAll = 0;
        for (var i = 0; i < list.length; i++) {
            var b = list[i];
            if (bookingIsCompleted(b)) completedAll++;
            if (b.date === todayISO) totalToday++;
            if (!bookingIsCompleted(b) && (!b.date || b.date >= todayISO)) upcoming++;
        }

        var elTotal = $("#bd-stat-today-total");
        var elUp = $("#bd-stat-upcoming");
        var elDone = $("#bd-stat-completed");
        if (elTotal) elTotal.textContent = String(totalToday);
        if (elUp) elUp.textContent = String(upcoming);
        if (elDone) elDone.textContent = String(completedAll);

        var elHomeBookings = $("#bd-home-today-bookings-count");
        if (elHomeBookings) elHomeBookings.textContent = String(totalToday);

        var nextEl = $("#bd-home-next-appointment");
        if (nextEl) {
            var candidates = list.filter(function (b) {
                return !bookingIsCompleted(b);
            });
            candidates.sort(function (a, b) {
                var da = (a.date || "").localeCompare(b.date || "");
                if (da !== 0) return da;
                return compareBookingTime(a, b);
            });
            var next = null;
            for (var j = 0; j < candidates.length; j++) {
                if (!candidates[j].date || candidates[j].date >= todayISO) {
                    next = candidates[j];
                    break;
                }
            }
            if (!next) {
                nextEl.textContent = "No upcoming appointments";
            } else {
                var dayPart = next.date === todayISO ? "Today" : formatBookingsDateHeading(next.date);
                var who = String(next.client || "Guest").trim() || "Guest";
                var svc = String(next.service || "").trim();
                var bits = [dayPart, formatTime24h(next.time), who];
                if (svc) bits.push(svc);
                nextEl.textContent = bits.join(" · ");
            }
        }
    }

    function renderOverview(session, state) {
        var ln = state.listing && state.listing.businessName;
        var label = ln || session.businessName || session.displayName || "Your business";
        var nameEl = $("#bd-overview-business");
        if (nameEl) nameEl.textContent = label;
        var homeName = $("#bd-home-business");
        if (homeName) homeName.textContent = label;
        var topbarBiz = $("#bd-topbar-business");
        if (topbarBiz) topbarBiz.textContent = label;
        renderTodayOverview(state);
    }

    function renderServiceRows(state, handlers) {
        var tbody = $("#bd-services-tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        state.services.forEach(function (svc) {
            var tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" +
                escapeHtml(svc.name) +
                "</td>" +
                "<td>" +
                escapeHtml(String(svc.durationMin != null ? svc.durationMin : "—")) +
                " min</td>" +
                "<td>" +
                escapeHtml(svc.price != null && svc.price !== "" ? "$" + svc.price : "—") +
                "</td>" +
                '<td class="bd-table__actions">' +
                '<button type="button" class="bd-link-btn" data-action="edit" data-id="' +
                escapeAttr(svc.id) +
                '">Edit</button> ' +
                '<button type="button" class="bd-link-btn bd-link-btn--danger" data-action="del" data-id="' +
                escapeAttr(svc.id) +
                '">Delete</button>' +
                "</td>";
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-action]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var id = btn.getAttribute("data-id");
                var action = btn.getAttribute("data-action");
                if (action === "edit") handlers.onEdit(id);
                if (action === "del") handlers.onDelete(id);
            });
        });
    }

    function renderStaffPanel(state) {
        var enabledEl = $("#bd-staff-section-enabled");
        var bookingEl = $("#bd-staff-booking-enabled");
        var titleEl = $("#bd-staff-section-title");
        var tbody = $("#bd-staff-tbody");
        if (enabledEl) enabledEl.checked = !!state.staffSectionEnabled;
        if (bookingEl) bookingEl.checked = !!state.staffBookingEnabled;
        if (titleEl) titleEl.value = state.staffSectionTitle || "Staff";
        if (!tbody) return;
        tbody.innerHTML = "";
        var list = Array.isArray(state.staff) ? state.staff : [];
        if (!list.length) {
            var tr0 = document.createElement("tr");
            tr0.innerHTML =
                '<td colspan="5" class="bd-empty bd-empty--compact">No staff yet. Add barbers, clinicians, coaches, or front desk — optional for every business.</td>';
            tbody.appendChild(tr0);
            return;
        }
        list.forEach(function (m) {
            var svcNames = (m.serviceIds || [])
                .map(function (sid) {
                    var s = state.services.find(function (x) {
                        return x.id === sid;
                    });
                    return s ? s.name : "";
                })
                .filter(Boolean);
            var svcCell = svcNames.length ? escapeHtml(svcNames.join(", ")) : "—";
            var tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" +
                (m.photo
                    ? '<span class="inline-flex h-9 w-9 overflow-hidden rounded-full border border-border align-middle"><img src="' +
                      escapeAttr(m.photo) +
                      '" alt="" class="h-full w-full object-cover" loading="lazy" decoding="async" /></span>'
                    : '<span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">' +
                      escapeHtml((m.name || "?").trim().slice(0, 1).toUpperCase()) +
                      "</span>") +
                "</td>" +
                "<td>" +
                escapeHtml(m.name) +
                "</td>" +
                "<td>" +
                escapeHtml(m.role || "—") +
                "</td>" +
                "<td>" +
                svcCell +
                "</td>" +
                '<td class="bd-table__actions">' +
                '<button type="button" class="bd-link-btn" data-staff-action="edit" data-staff-id="' +
                escapeAttr(m.id) +
                '">Edit</button> ' +
                '<button type="button" class="bd-link-btn bd-link-btn--danger" data-staff-action="del" data-staff-id="' +
                escapeAttr(m.id) +
                '">Delete</button>' +
                "</td>";
            tbody.appendChild(tr);
        });
    }

    function openStaffModal(mode, member, services, onSave) {
        var backdrop = $("#bd-staff-modal");
        if (!backdrop) return;
        var title = $("#bd-staff-modal-title");
        var name = $("#bd-staff-name");
        var role = $("#bd-staff-role");
        var desc = $("#bd-staff-description");
        var photoUrl = $("#bd-staff-photo-url");
        var photoFile = $("#bd-staff-photo-file");
        var bookable = $("#bd-staff-bookable");
        var wrapSvc = $("#bd-staff-services-checkboxes");
        var btnSave = $("#bd-staff-save");
        var btnCancel = $("#bd-staff-cancel");
        staffModalDraftPhoto = member && member.photo ? String(member.photo) : "";
        if (title) title.textContent = mode === "add" ? "Add staff" : "Edit staff";
        if (name) name.value = member ? member.name || "" : "";
        if (role) role.value = member ? member.role || "" : "";
        if (desc) desc.value = member ? member.description || "" : "";
        if (photoUrl) photoUrl.value = member && member.photo && String(member.photo).indexOf("data:") !== 0 ? member.photo : "";
        if (photoFile) photoFile.value = "";
        if (bookable) bookable.checked = !member || member.bookable !== false;
        if (wrapSvc) {
            wrapSvc.innerHTML = "";
            (services || []).forEach(function (svc) {
                var id = "bd-staff-svc-" + svc.id;
                var lab = document.createElement("label");
                lab.className = "flex cursor-pointer items-center gap-2 text-sm";
                var picked = member && Array.isArray(member.serviceIds) && member.serviceIds.indexOf(svc.id) !== -1;
                lab.innerHTML =
                    '<input type="checkbox" id="' +
                    escapeAttr(id) +
                    '" data-staff-svc-id="' +
                    escapeAttr(svc.id) +
                    '" ' +
                    (picked ? "checked" : "") +
                    " />" +
                    "<span>" +
                    escapeHtml(svc.name) +
                    "</span>";
                wrapSvc.appendChild(lab);
            });
        }
        backdrop.hidden = false;
        backdrop.classList.add("is-open");

        function cleanup() {
            backdrop.hidden = true;
            backdrop.classList.remove("is-open");
            backdrop.removeEventListener("click", onBackdropClick);
            if (btnSave) btnSave.removeEventListener("click", onSaveClick);
            if (btnCancel) btnCancel.removeEventListener("click", onCancelClick);
            if (photoFile) photoFile.removeEventListener("change", onPhotoFile);
        }

        function onCancelClick() {
            cleanup();
        }

        function onBackdropClick(e) {
            if (e.target === backdrop) cleanup();
        }

        function onPhotoFile() {
            var f = photoFile && photoFile.files && photoFile.files[0];
            if (!f) return;
            if (f.size > 400 * 1024) {
                window.alert("Use an image under 400KB.");
                return;
            }
            var r = new FileReader();
            r.onload = function () {
                if (typeof r.result === "string") staffModalDraftPhoto = r.result;
            };
            r.readAsDataURL(f);
        }

        function onSaveClick() {
            var n = name ? name.value.trim() : "";
            if (!n) {
                window.alert("Enter a name.");
                return;
            }
            var ids = [];
            if (wrapSvc) {
                wrapSvc.querySelectorAll("input[type=checkbox][data-staff-svc-id]").forEach(function (cb) {
                    if (cb.checked) ids.push(cb.getAttribute("data-staff-svc-id"));
                });
            }
            var photoStr = "";
            if (staffModalDraftPhoto && String(staffModalDraftPhoto).indexOf("data:") === 0) {
                photoStr = staffModalDraftPhoto;
            } else if (photoUrl && photoUrl.value.trim()) {
                photoStr = photoUrl.value.trim();
            } else if (staffModalDraftPhoto) {
                photoStr = String(staffModalDraftPhoto);
            }
            onSave({
                name: n,
                role: role ? role.value.trim() : "",
                description: desc ? desc.value.trim() : "",
                photo: photoStr,
                serviceIds: ids,
                bookable: bookable ? !!bookable.checked : true,
            });
            cleanup();
        }

        if (photoFile) photoFile.addEventListener("change", onPhotoFile);
        backdrop.addEventListener("click", onBackdropClick);
        if (btnSave) btnSave.addEventListener("click", onSaveClick);
        if (btnCancel) btnCancel.addEventListener("click", onCancelClick);
        if (name) name.focus();
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeAttr(s) {
        return escapeHtml(s).replace(/'/g, "&#39;");
    }

    function closeListingSwitcherMenu() {
        var m = $("#bd-listing-switcher-menu");
        var t = $("#bd-listing-switcher-trigger");
        if (m) {
            m.classList.add("hidden");
            m.setAttribute("hidden", "");
        }
        if (t) t.setAttribute("aria-expanded", "false");
    }

    function openListingSwitcherMenu() {
        var m = $("#bd-listing-switcher-menu");
        var t = $("#bd-listing-switcher-trigger");
        if (m) {
            m.classList.remove("hidden");
            m.removeAttribute("hidden");
        }
        if (t) t.setAttribute("aria-expanded", "true");
    }

    function renderListingSwitcher(state) {
        var wrap = $("#bd-listing-switcher-wrap");
        var trigger = $("#bd-listing-switcher-trigger");
        var menu = $("#bd-listing-switcher-menu");
        var caret = $("#bd-listing-switcher-caret");
        if (!wrap || !trigger || !menu) return;
        closeListingSwitcherMenu();
        var filled = (state.listings || []).filter(listingHasContent);
        menu.innerHTML = "";
        filled.forEach(function (L) {
            var isActive = state.activeListingId === L.id;
            var btn = document.createElement("button");
            btn.type = "button";
            btn.setAttribute("role", "option");
            btn.setAttribute("aria-selected", isActive ? "true" : "false");
            btn.className =
                "w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60 focus:bg-muted/60 focus:outline-none " +
                (isActive ? "bg-muted/70 font-medium" : "");
            btn.setAttribute("data-bd-switcher-listing-id", L.id);
            btn.textContent = L.businessName || "Untitled";
            menu.appendChild(btn);
        });
        if (caret) caret.classList.remove("hidden");
        trigger.removeAttribute("disabled");
        trigger.setAttribute("aria-haspopup", "listbox");
        var addRow = document.createElement("button");
        addRow.type = "button";
        addRow.className =
            "w-full border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted/40 focus:bg-muted/40 focus:outline-none";
        addRow.setAttribute("data-bd-add-new-listing", "");
        addRow.textContent = "+ Add new listing";
        menu.appendChild(addRow);
    }

    function wireListingSwitcher(state, persist, refreshAll) {
        if (wireListingSwitcher.did) return;
        wireListingSwitcher.did = true;
        var wrap = $("#bd-listing-switcher-wrap");
        var trigger = $("#bd-listing-switcher-trigger");
        var menu = $("#bd-listing-switcher-menu");
        if (!wrap || !trigger || !menu) return;
        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            var isOpen = !menu.classList.contains("hidden");
            if (isOpen) closeListingSwitcherMenu();
            else openListingSwitcherMenu();
        });
        menu.addEventListener("click", function (e) {
            e.stopPropagation();
            if (e.target.closest("[data-bd-add-new-listing]")) {
                startAddNewListing(state, persist, refreshAll);
                closeListingSwitcherMenu();
                return;
            }
            var opt = e.target.closest("[data-bd-switcher-listing-id]");
            if (!opt) return;
            var id = opt.getAttribute("data-bd-switcher-listing-id");
            var L = (state.listings || []).find(function (x) {
                return x.id === id;
            });
            if (!L) return;
            flushOperationalDataToActiveListing(state);
            state.activeListingId = id;
            state.listing = L;
            applyDashboardDataFromActiveListing(state);
            persist();
            closeListingSwitcherMenu();
            refreshAll();
        });
        document.addEventListener("click", function () {
            closeListingSwitcherMenu();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if (menu && !menu.classList.contains("hidden")) closeListingSwitcherMenu();
        });
    }

    function openServiceModal(mode, svc, onSave) {
        var backdrop = $("#bd-service-modal");
        if (!backdrop) return;
        var title = $("#bd-service-modal-title");
        var name = $("#bd-svc-name");
        var dur = $("#bd-svc-duration");
        var price = $("#bd-svc-price");
        var btnSave = $("#bd-svc-save");
        var btnCancel = $("#bd-svc-cancel");
        if (title) title.textContent = mode === "add" ? "Add service" : "Edit service";
        if (name) name.value = svc ? svc.name || "" : "";
        if (dur) dur.value = svc && svc.durationMin != null ? String(svc.durationMin) : "";
        if (price) price.value = svc && svc.price != null && svc.price !== "" ? String(svc.price) : "";
        backdrop.hidden = false;
        backdrop.classList.add("is-open");

        function cleanup() {
            backdrop.hidden = true;
            backdrop.classList.remove("is-open");
            backdrop.removeEventListener("click", onBackdropClick);
            if (btnSave) btnSave.removeEventListener("click", onSaveClick);
            if (btnCancel) btnCancel.removeEventListener("click", onCancelClick);
        }

        function onCancelClick() {
            cleanup();
        }

        function onBackdropClick(e) {
            if (e.target === backdrop) cleanup();
        }

        function onSaveClick() {
            var n = name ? name.value.trim() : "";
            if (!n) {
                window.alert("Enter a service name.");
                return;
            }
            var d = dur ? parseInt(dur.value, 10) : NaN;
            var p = price ? price.value.trim() : "";
            onSave({
                name: n,
                durationMin: isNaN(d) ? null : d,
                price: p === "" ? null : p,
            });
            cleanup();
        }

        backdrop.addEventListener("click", onBackdropClick);
        if (btnSave) btnSave.addEventListener("click", onSaveClick);
        if (btnCancel) btnCancel.addEventListener("click", onCancelClick);
        if (name) name.focus();
    }

    var listingFormDraftImages = [];

    function bdPhotoLbPrefersReducedMotion() {
        try {
            return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch (e) {
            return false;
        }
    }

    /** Full-screen listing photo viewer (create / edit listing thumbnails). */
    var bdPhotoLb = {
        root: null,
        strip: null,
        imgWrap: null,
        btnClose: null,
        btnPrev: null,
        btnNext: null,
        images: [],
        index: 0,
        open: false,
        bodyPrevOverflow: "",
        closeTimer: 0,
        onKey: null,
        pointerStartX: null,
        pointerId: null,
        stripScrollRaf: null,
        bound: false,
        onTe: null,
        onPointerDown: null,
        onPointerUp: null,
        onPointerCancel: null,
        onStripScroll: null,
        onStripScrollEnd: null,
        syncStripIndex: null,
    };

    function ensureBusinessPhotoLightbox() {
        if (bdPhotoLb.root) return;
        bdPhotoLb.root = document.getElementById("bd-photo-lightbox");
        if (!bdPhotoLb.root) return;
        bdPhotoLb.strip = document.getElementById("bd-photo-lightbox-strip");
        bdPhotoLb.imgWrap = bdPhotoLb.root.querySelector(".bd-photo-lightbox__img-wrap");
        bdPhotoLb.btnClose = bdPhotoLb.root.querySelector("[data-bd-photo-lightbox-close]");
        bdPhotoLb.btnPrev = bdPhotoLb.root.querySelector("[data-bd-photo-lightbox-prev]");
        bdPhotoLb.btnNext = bdPhotoLb.root.querySelector("[data-bd-photo-lightbox-next]");
        var underlay = bdPhotoLb.root.querySelector("[data-bd-photo-lightbox-dismiss]");
        bdPhotoLb.onKey = function (e) {
            if (!bdPhotoLb.open) return;
            if (e.key === "Escape") {
                e.preventDefault();
                closeBusinessPhotoLightbox();
                return;
            }
            if (bdPhotoLb.images.length <= 1) return;
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                businessPhotoLightboxPrev();
                return;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                businessPhotoLightboxNext();
            }
        };
        if (underlay) {
            underlay.addEventListener("click", function () {
                closeBusinessPhotoLightbox();
            });
        }
    }

    function renderBusinessPhotoLightboxStrip() {
        var strip = bdPhotoLb.strip || document.getElementById("bd-photo-lightbox-strip");
        bdPhotoLb.strip = strip;
        if (!strip) return;
        strip.innerHTML = "";
        var urls = bdPhotoLb.images;
        var n = urls.length;
        for (var k = 0; k < n; k++) {
            var u = typeof urls[k] === "string" ? urls[k] : "";
            if (!u) continue;
            var slide = document.createElement("div");
            slide.className = "bd-photo-lightbox__slide";
            var img = document.createElement("img");
            img.className = "bd-photo-lightbox__slide-img";
            img.src = u;
            img.alt = "Listing photo " + (k + 1) + " of " + n;
            img.decoding = "async";
            img.draggable = false;
            slide.appendChild(img);
            strip.appendChild(slide);
        }
    }

    function updateBusinessPhotoLightboxView(initial) {
        var strip = bdPhotoLb.strip;
        var urls = bdPhotoLb.images;
        if (!strip || !urls.length) return;
        var i = bdPhotoLb.index;
        var n = urls.length;
        if (bdPhotoLb.btnPrev) bdPhotoLb.btnPrev.hidden = n <= 1;
        if (bdPhotoLb.btnNext) bdPhotoLb.btnNext.hidden = n <= 1;
        var w = strip.clientWidth;
        if (w < 1) {
            window.requestAnimationFrame(function () {
                updateBusinessPhotoLightboxView(initial);
            });
            return;
        }
        var behavior = initial || bdPhotoLbPrefersReducedMotion() ? "auto" : "smooth";
        strip.scrollTo({ left: i * w, behavior: behavior });
    }

    function businessPhotoLightboxNext() {
        if (!bdPhotoLb.open || bdPhotoLb.images.length <= 1) return;
        bdPhotoLb.index = (bdPhotoLb.index + 1) % bdPhotoLb.images.length;
        updateBusinessPhotoLightboxView(false);
    }

    function businessPhotoLightboxPrev() {
        if (!bdPhotoLb.open || bdPhotoLb.images.length <= 1) return;
        var n = bdPhotoLb.images.length;
        bdPhotoLb.index = (bdPhotoLb.index - 1 + n) % n;
        updateBusinessPhotoLightboxView(false);
    }

    function openBusinessPhotoLightbox(images, startIndex) {
        ensureBusinessPhotoLightbox();
        if (!bdPhotoLb.root || !images || !images.length) return;
        var copy = images.filter(function (x) {
            return typeof x === "string" && x.trim();
        });
        if (!copy.length) return;
        bdPhotoLb.images = copy;
        var n = bdPhotoLb.images.length;
        var s = parseInt(startIndex, 10);
        if (isNaN(s)) s = 0;
        bdPhotoLb.index = ((s % n) + n) % n;
        bdPhotoLb.open = true;
        bdPhotoLb.pointerStartX = null;
        bdPhotoLb.pointerId = null;
        bdPhotoLb.bodyPrevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        var root = bdPhotoLb.root;
        window.clearTimeout(bdPhotoLb.closeTimer);
        if (bdPhotoLb.onTe) {
            root.removeEventListener("transitionend", bdPhotoLb.onTe);
            bdPhotoLb.onTe = null;
        }
        root.removeAttribute("hidden");
        root.setAttribute("aria-hidden", "false");
        root.classList.remove("bd-photo-lightbox--open");
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                root.classList.add("bd-photo-lightbox--open");
            });
        });
        renderBusinessPhotoLightboxStrip();
        updateBusinessPhotoLightboxView(true);
        document.addEventListener("keydown", bdPhotoLb.onKey);
        if (bdPhotoLb.btnClose) bdPhotoLb.btnClose.focus();
    }

    function closeBusinessPhotoLightbox() {
        if (!bdPhotoLb.open) return;
        bdPhotoLb.open = false;
        bdPhotoLb.pointerStartX = null;
        bdPhotoLb.pointerId = null;
        if (bdPhotoLb.stripScrollRaf != null) {
            window.cancelAnimationFrame(bdPhotoLb.stripScrollRaf);
            bdPhotoLb.stripScrollRaf = null;
        }
        if (bdPhotoLb.strip) bdPhotoLb.strip.innerHTML = "";
        if (bdPhotoLb.onKey) document.removeEventListener("keydown", bdPhotoLb.onKey);
        var root = bdPhotoLb.root;
        if (!root) return;
        root.classList.remove("bd-photo-lightbox--open");
        root.setAttribute("aria-hidden", "true");
        var didFinish = false;
        var finished = function () {
            if (didFinish) return;
            didFinish = true;
            root.setAttribute("hidden", "");
            document.body.style.overflow = bdPhotoLb.bodyPrevOverflow || "";
            bdPhotoLb.closeTimer = 0;
            if (bdPhotoLb.onTe) {
                root.removeEventListener("transitionend", bdPhotoLb.onTe);
                bdPhotoLb.onTe = null;
            }
        };
        window.clearTimeout(bdPhotoLb.closeTimer);
        bdPhotoLb.closeTimer = window.setTimeout(finished, 320);
        bdPhotoLb.onTe = function (ev) {
            if (ev.target !== root || ev.propertyName !== "opacity") return;
            window.clearTimeout(bdPhotoLb.closeTimer);
            bdPhotoLb.closeTimer = 0;
            finished();
        };
        root.addEventListener("transitionend", bdPhotoLb.onTe);
    }

    function bindBusinessPhotoLightbox() {
        ensureBusinessPhotoLightbox();
        if (!bdPhotoLb.root || bdPhotoLb.bound) return;
        bdPhotoLb.bound = true;
        if (bdPhotoLb.btnClose) {
            bdPhotoLb.btnClose.addEventListener("click", function () {
                closeBusinessPhotoLightbox();
            });
        }
        if (bdPhotoLb.btnPrev) bdPhotoLb.btnPrev.addEventListener("click", businessPhotoLightboxPrev);
        if (bdPhotoLb.btnNext) bdPhotoLb.btnNext.addEventListener("click", businessPhotoLightboxNext);
        bdPhotoLb.onPointerDown = function (e) {
            if (!bdPhotoLb.open || bdPhotoLb.images.length <= 1) return;
            if (e.button !== 0 && e.pointerType === "mouse") return;
            var t = e.target;
            if (t && t.closest && t.closest("button")) return;
            bdPhotoLb.pointerStartX = e.clientX;
            bdPhotoLb.pointerId = e.pointerId;
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch (err) {}
        };
        bdPhotoLb.onPointerUp = function (e) {
            if (bdPhotoLb.pointerStartX == null) return;
            if (bdPhotoLb.pointerId != null && e.pointerId !== bdPhotoLb.pointerId) return;
            var startX = bdPhotoLb.pointerStartX;
            var endX = e.clientX;
            var capId = bdPhotoLb.pointerId;
            bdPhotoLb.pointerStartX = null;
            bdPhotoLb.pointerId = null;
            try {
                if (capId != null && e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(capId)) {
                    e.currentTarget.releasePointerCapture(capId);
                }
            } catch (err2) {}
            if (!bdPhotoLb.open || bdPhotoLb.images.length <= 1) return;
            var diff = startX - endX;
            if (diff > 50) businessPhotoLightboxNext();
            else if (diff < -50) businessPhotoLightboxPrev();
        };
        bdPhotoLb.onPointerCancel = function (e) {
            if (bdPhotoLb.pointerId != null && e.pointerId !== bdPhotoLb.pointerId) return;
            var capId = bdPhotoLb.pointerId;
            bdPhotoLb.pointerStartX = null;
            bdPhotoLb.pointerId = null;
            try {
                if (capId != null && e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(capId)) {
                    e.currentTarget.releasePointerCapture(capId);
                }
            } catch (err3) {}
        };
        bdPhotoLb.syncStripIndex = function () {
            var strip = bdPhotoLb.strip;
            if (!strip || !bdPhotoLb.open || bdPhotoLb.images.length <= 1) return;
            var n = bdPhotoLb.images.length;
            var w = strip.clientWidth;
            if (w < 1) return;
            var i = Math.min(n - 1, Math.max(0, Math.round(strip.scrollLeft / w)));
            bdPhotoLb.index = i;
        };
        bdPhotoLb.onStripScrollEnd = function () {
            bdPhotoLb.syncStripIndex();
        };
        bdPhotoLb.onStripScroll = function () {
            if (bdPhotoLb.stripScrollRaf != null) return;
            bdPhotoLb.stripScrollRaf = window.requestAnimationFrame(function () {
                bdPhotoLb.stripScrollRaf = null;
                bdPhotoLb.syncStripIndex();
            });
        };
        if (bdPhotoLb.strip) {
            bdPhotoLb.strip.addEventListener("scrollend", bdPhotoLb.onStripScrollEnd, { passive: true });
            bdPhotoLb.strip.addEventListener("scroll", bdPhotoLb.onStripScroll, { passive: true });
        }
        if (bdPhotoLb.strip) {
            bdPhotoLb.strip.addEventListener("pointerdown", bdPhotoLb.onPointerDown);
            bdPhotoLb.strip.addEventListener("pointerup", bdPhotoLb.onPointerUp);
            bdPhotoLb.strip.addEventListener("pointercancel", bdPhotoLb.onPointerCancel);
        }
        document.addEventListener("click", function (e) {
            var thumb = e.target && e.target.closest ? e.target.closest(".bd-listing-images-preview__thumb") : null;
            if (!thumb || !thumb.closest("#bd-listing-images-preview")) return;
            var raw = thumb.getAttribute("data-bd-photo-ix");
            var ix = raw != null ? parseInt(raw, 10) : NaN;
            if (isNaN(ix)) return;
            e.preventDefault();
            openBusinessPhotoLightbox(listingFormDraftImages, ix);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" && e.key !== " ") return;
            var thumb =
                e.target && e.target.closest ? e.target.closest(".bd-listing-images-preview__thumb") : null;
            if (!thumb || !thumb.closest("#bd-listing-images-preview")) return;
            e.preventDefault();
            var raw = thumb.getAttribute("data-bd-photo-ix");
            var ix = raw != null ? parseInt(raw, 10) : NaN;
            if (isNaN(ix)) return;
            openBusinessPhotoLightbox(listingFormDraftImages, ix);
        });
    }

    function listingFormRoot() {
        return $("#bd-panel-add-listing");
    }

    function renderListingImagePreview() {
        var root = listingFormRoot();
        if (!root) return;
        var preview = root.querySelector("#bd-listing-images-preview");
        if (!preview) return;
        preview.innerHTML = "";
        listingFormDraftImages.forEach(function (url, idx) {
            var img = document.createElement("img");
            img.src = url;
            img.alt = "Listing image " + (idx + 1);
            img.className = "bd-listing-images-preview__thumb";
            img.setAttribute("data-bd-photo-ix", String(idx));
            img.setAttribute("role", "button");
            img.setAttribute("tabindex", "0");
            img.setAttribute("aria-label", "Enlarge photo " + (idx + 1));
            preview.appendChild(img);
        });
    }

    function readListingFilesSequential(files, i, maxBytes, done) {
        if (!files || i >= files.length || listingFormDraftImages.length >= 6) {
            done();
            return;
        }
        var f = files[i];
        if (!f || !f.type || f.type.indexOf("image/") !== 0) {
            readListingFilesSequential(files, i + 1, maxBytes, done);
            return;
        }
        if (f.size > maxBytes) {
            readListingFilesSequential(files, i + 1, maxBytes, done);
            return;
        }
        var r = new FileReader();
        r.onload = function () {
            if (typeof r.result === "string" && listingFormDraftImages.length < 6) listingFormDraftImages.push(r.result);
            readListingFilesSequential(files, i + 1, maxBytes, done);
        };
        r.onerror = function () {
            readListingFilesSequential(files, i + 1, maxBytes, done);
        };
        r.readAsDataURL(f);
    }

    function populateListingFormPage(state) {
        var root = listingFormRoot();
        if (!root) return;
        var name = root.querySelector("#bd-listing-name");
        var desc = root.querySelector("#bd-listing-description");
        var svcs = root.querySelector("#bd-listing-services");
        var loc = root.querySelector("#bd-listing-location");
        var fileInput = root.querySelector("#bd-listing-images");
        var L = state.listing || normalizeListing(null);
        if (name) name.value = L.businessName || "";
        if (desc) desc.value = L.description || "";
        if (svcs) svcs.value = L.services || "";
        if (loc) loc.value = L.location || "";
        if (fileInput) fileInput.value = "";
        listingFormDraftImages = (L.images || []).slice();
        renderListingImagePreview();
        var pageTitle = root.querySelector("#bd-listing-page-heading");
        if (pageTitle) {
            var hasListing =
                (L.businessName && L.businessName.length > 0) ||
                (L.description && L.description.length > 0) ||
                (L.location && L.location.length > 0);
            pageTitle.textContent = hasListing ? "Edit listing" : "Create listing";
        }
        if (name) name.focus();
    }

    function bindListingFormPage(sessionRef, state, persist, refreshAll) {
        var root = listingFormRoot();
        if (!root || bindListingFormPage.did) return;
        bindListingFormPage.did = true;
        var name = root.querySelector("#bd-listing-name");
        var desc = root.querySelector("#bd-listing-description");
        var svcs = root.querySelector("#bd-listing-services");
        var loc = root.querySelector("#bd-listing-location");
        var fileInput = root.querySelector("#bd-listing-images");
        var btnSave = root.querySelector("#bd-listing-save");
        var btnCancel = root.querySelector("#bd-listing-cancel");

        if (fileInput) {
            fileInput.addEventListener("change", function () {
                var files = fileInput.files;
                if (!files || !files.length) return;
                readListingFilesSequential(files, 0, 400 * 1024, function () {
                    renderListingImagePreview();
                });
            });
        }

        function goMyListings() {
            applyDashboardUrl("my-listings");
            setActiveNav("#my-listings");
        }

        function onSaveClick() {
            var bn = name ? name.value.trim() : "";
            if (!bn) {
                window.alert("Enter a business name.");
                return;
            }
            var prevId = state.listing && state.listing.id ? state.listing.id : null;
            var prevRow = prevId
                ? state.listings.find(function (x) {
                      return x.id === prevId;
                  })
                : null;
            state.listing = normalizeListing({
                id: prevId || listingId(),
                businessName: bn,
                description: desc ? desc.value : "",
                services: svcs ? svcs.value : "",
                location: loc ? loc.value : "",
                images: listingFormDraftImages,
                dashboardServices:
                    prevRow && Array.isArray(prevRow.dashboardServices) && prevRow.dashboardServices.length
                        ? prevRow.dashboardServices
                        : state.services,
                dashboardBookings:
                    prevRow && Array.isArray(prevRow.dashboardBookings) && prevRow.dashboardBookings.length
                        ? prevRow.dashboardBookings
                        : state.upcomingBookings,
                dashboardStaff: JSON.parse(JSON.stringify(state.staff || [])),
                staffSectionEnabled: !!state.staffSectionEnabled,
                staffBookingEnabled: !!state.staffBookingEnabled,
                staffSectionTitle: state.staffSectionTitle || "Staff",
            });
            if (!Array.isArray(state.listings)) state.listings = [];
            var ix = state.listings.findIndex(function (x) {
                return x.id === state.listing.id;
            });
            if (ix === -1) state.listings.push(state.listing);
            else state.listings[ix] = state.listing;
            state.activeListingId = state.listing.id;
            var A = auth();
            if (sessionRef.role === "user" && A && typeof A.promoteToBusiness === "function") {
                var pr = A.promoteToBusiness(bn);
                if (!pr.ok) {
                    window.alert(pr.error || "Could not update account.");
                    return;
                }
                sessionRef.email = pr.session.email;
                sessionRef.role = pr.session.role;
                sessionRef.displayName = pr.session.displayName;
                sessionRef.businessName = pr.session.businessName;
                dashboardSessionIsBusiness = true;
            } else if (sessionRef.role === "business" && A && typeof A.updateBusinessName === "function") {
                var ur = A.updateBusinessName(bn);
                if (ur.ok && ur.session) {
                    sessionRef.businessName = ur.session.businessName;
                }
            }
            persist();
            refreshAll();
            window.alert("Listing saved.");
            goMyListings();
        }

        if (btnSave) btnSave.addEventListener("click", onSaveClick);
        if (btnCancel) btnCancel.addEventListener("click", goMyListings);
    }

    function renderMyListings(state) {
        var body = $("#bd-my-listings-body");
        if (!body) return;
        var listings = Array.isArray(state.listings) ? state.listings : [];
        var withContent = listings.filter(listingHasContent);
        if (!withContent.length) {
            body.innerHTML =
                '<p class="bd-empty">You have no saved listing yet.</p>' +
                '<p class="bd-main__sub" style="margin-top:8px">Create a listing to describe your business, location, and photos. Add structured services from the Services section after you save.</p>' +
                '<button type="button" class="bd-pill-btn bd-pill-btn--primary" style="margin-top:14px" data-bd-add-new-listing>+ Add new listing</button>';
            return;
        }
        var parts = ['<div class="flex flex-col gap-4" style="margin-top:4px">'];
        for (var i = 0; i < withContent.length; i++) {
            var L = withContent[i];
            var imgCount = L.images && L.images.length ? L.images.length : 0;
            var descShort = L.description
                ? escapeHtml(L.description.length > 160 ? L.description.slice(0, 160) + "…" : L.description)
                : "";
            var lid = L.id ? escapeAttr(L.id) : "";
            parts.push(
                '<article class="bd-card" style="padding:16px;border:1px solid hsl(var(--border));border-radius:12px;background:#fff">' +
                    '<h3 class="bd-card__title" style="margin-bottom:8px">' +
                    escapeHtml(L.businessName || "Untitled") +
                    "</h3>" +
                    (L.location ? '<p class="bd-main__sub">' + escapeHtml(L.location) + "</p>" : "") +
                    (descShort ? '<p style="margin-top:10px;font-size:0.875rem;line-height:1.5">' + descShort + "</p>" : "") +
                    (imgCount ? '<p class="bd-hint" style="margin-top:10px">' + imgCount + " image(s)</p>" : "") +
                    '<button type="button" class="bd-pill-btn bd-pill-btn--primary" style="margin-top:14px" data-bd-edit-listing="' +
                    lid +
                    '">Edit listing</button>' +
                    "</article>"
            );
        }
        parts.push(
            '<button type="button" class="bd-pill-btn" style="align-self:flex-start;margin-top:4px" data-bd-add-new-listing>+ Add new listing</button>'
        );
        parts.push("</div>");
        body.innerHTML = parts.join("");
    }

    function goAddListing() {
        applyDashboardUrl("add-listing");
        setActiveNav("#add-listing");
    }

    /** New location/brand: branches on whether any saved listing already exists. */
    function startAddNewListing(state, persist, refreshAll) {
        var filled = (state.listings || []).filter(listingHasContent);
        if (!filled.length) {
            goAddListing();
            return;
        }
        flushOperationalDataToActiveListing(state);
        var newL = normalizeListing(null);
        newL.id = listingId();
        if (!Array.isArray(state.listings)) state.listings = [];
        state.listings.push(newL);
        state.activeListingId = newL.id;
        state.listing = newL;
        state.services = [
            {
                id: uid(),
                name: "Intro consultation",
                durationMin: 30,
                price: "85",
                schedule: defaultSchedule(),
            },
        ];
        state.upcomingBookings = seedDemoBookings(state.services);
        ensureBookingIds(state.upcomingBookings);
        hydrateBookingTimeRange(state.upcomingBookings, state.services);
        state.staff = [];
        state.staffSectionEnabled = false;
        state.staffBookingEnabled = false;
        state.staffSectionTitle = "Staff";
        persist();
        refreshAll();
        goAddListing();
    }

    function fillServiceSelects(state, selectedId) {
        var sel = $("#bd-schedule-service");
        if (!sel) return;
        sel.innerHTML = "";
        state.services.forEach(function (svc) {
            var opt = document.createElement("option");
            opt.value = svc.id;
            opt.textContent = svc.name;
            sel.appendChild(opt);
        });
        if (selectedId && state.services.some(function (s) { return s.id === selectedId; })) {
            sel.value = selectedId;
        } else if (state.services[0]) sel.value = state.services[0].id;
    }

    function renderScheduleEditor(state, serviceId) {
        var svc = state.services.find(function (s) {
            return s.id === serviceId;
        });
        var wrap = $("#bd-schedule-rows");
        if (!wrap || !svc) return;
        wrap.innerHTML = "";
        DAYS.forEach(function (d) {
            var row = svc.schedule[d.key] || defaultDay();
            var div = document.createElement("div");
            div.className = "bd-schedule-row";
            div.innerHTML =
                '<label class="bd-schedule-row__day"><input type="checkbox" data-day="' +
                d.key +
                '" ' +
                (row.enabled ? "checked" : "") +
                " /> " +
                escapeHtml(d.label) +
                "</label>" +
                '<div class="bd-schedule-row__times">' +
                '<label class="visually-hidden" for="bd-start-' +
                d.key +
                '">Opens</label>' +
                '<input type="time" class="bd-input bd-input--time" id="bd-start-' +
                d.key +
                '" data-start="' +
                d.key +
                '" value="' +
                escapeAttr(row.start || "09:00") +
                '" />' +
                '<span class="bd-schedule-row__sep">to</span>' +
                '<label class="visually-hidden" for="bd-end-' +
                d.key +
                '">Closes</label>' +
                '<input type="time" class="bd-input bd-input--time" id="bd-end-' +
                d.key +
                '" data-end="' +
                d.key +
                '" value="' +
                escapeAttr(row.end || "17:00") +
                '" />' +
                "</div>";
            wrap.appendChild(div);
        });
    }

    function readScheduleFromDom() {
        var sched = {};
        DAYS.forEach(function (d) {
            var cb = $('input[type="checkbox"][data-day="' + d.key + '"]');
            var st = $('input[data-start="' + d.key + '"]');
            var en = $('input[data-end="' + d.key + '"]');
            sched[d.key] = {
                enabled: !!(cb && cb.checked),
                start: st && st.value ? st.value : "09:00",
                end: en && en.value ? en.value : "17:00",
            };
        });
        return sched;
    }

    function formatTime12h(timeStr) {
        var p = String(timeStr || "").split(":");
        var h = parseInt(p[0], 10);
        var m = parseInt(p[1] != null ? p[1] : "0", 10);
        if (isNaN(h)) return timeStr || "—";
        var h24 = ((h % 24) + 24) % 24;
        var am = h24 < 12;
        var h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        var mm = pad2(isNaN(m) ? 0 : m);
        return h12 + ":" + mm + (am ? " AM" : " PM");
    }

    function slugPart(s) {
        return String(s || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 28);
    }

    function stableBookingId(b) {
        return (
            "bid_" +
            String(b.date || "") +
            "_" +
            String(b.time || "00:00").replace(/:/g, "") +
            "_" +
            String(b.serviceId || slugPart(b.service)) +
            "_" +
            slugPart(b.client)
        );
    }

    function ensureBookingIds(list) {
        var seen = {};
        list.forEach(function (b) {
            if (b.id && typeof b.id === "string") {
                var id0 = b.id;
                if (seen[id0]) {
                    var base = id0;
                    var n = 1;
                    while (seen[b.id]) b.id = base + "_" + n++;
                }
                seen[b.id] = true;
                return;
            }
            var id = stableBookingId(b);
            var base = id;
            var n = 0;
            while (seen[id]) id = base + "_" + ++n;
            b.id = id;
            seen[id] = true;
        });
    }

    function renderBookings(state) {
        var todayISO = toISODate(new Date());
        var all = state.upcomingBookings || [];
        var todayBookings = all
            .filter(function (b) {
                return b.date === todayISO;
            })
            .sort(compareBookingTime);
        var listEl = $("#bd-bookings-today-list");
        var emptyEl = $("#bd-bookings-today-empty");
        var laterList = $("#bd-bookings-later-list");
        var upcomingEmpty = $("#bd-bookings-upcoming-empty");
        if (!listEl || !emptyEl) return;

        var laterBookings = all
            .filter(function (b) {
                return b.date !== todayISO;
            })
            .sort(function (a, b) {
                var da = (a.date || "").localeCompare(b.date || "");
                if (da !== 0) return da;
                return compareBookingTime(a, b);
            });

        function bookingRowClass(b, opts) {
            opts = opts || {};
            var isLater = opts.variant === "later";
            var c =
                "bd-booking-row flex w-full items-start gap-3 border-b border-border/55 last:border-b-0";
            if (isLater) {
                c += " py-2";
            } else {
                c += " py-3 border-l-2 pl-3 ";
                c += opts.highlightFirst ? "bd-booking-row--highlight" : "border-transparent";
            }
            if (bookingIsCompleted(b)) c += " bd-booking-row--done";
            return c;
        }

        function bookingRowInnerHtml(b, opts) {
            opts = opts || {};
            var later = opts.variant === "later";
            var timeCls = later
                ? "w-[4rem] shrink-0 tabular-nums text-left text-xs font-semibold text-foreground"
                : "w-[4.75rem] shrink-0 tabular-nums text-left text-base font-semibold text-foreground";
            var clientCls = later
                ? "truncate text-xs font-semibold text-foreground"
                : "truncate text-base font-semibold text-foreground";
            var svcCls = later
                ? "truncate text-xs text-muted-foreground"
                : "truncate text-sm text-muted-foreground";
            var timeLabel = formatTime24h(b.time);
            return (
                '<time class="' +
                timeCls +
                '" datetime="' +
                escapeAttr((b.date || "") + "T" + (b.time || "00:00")) +
                '">' +
                escapeHtml(timeLabel) +
                '</time><div class="min-w-0 flex-1"><div class="' +
                clientCls +
                '">' +
                escapeHtml(b.client || "—") +
                '</div><div class="' +
                svcCls +
                '">' +
                escapeHtml(b.service || "—") +
                "</div></div>"
            );
        }

        listEl.innerHTML = "";
        if (!todayBookings.length) {
            emptyEl.hidden = false;
        } else {
            emptyEl.hidden = true;
            todayBookings.forEach(function (b, idx) {
                var li = document.createElement("li");
                li.className = bookingRowClass(b, { highlightFirst: idx === 0 });
                li.innerHTML = bookingRowInnerHtml(b, {});
                listEl.appendChild(li);
            });
        }

        if (laterList) {
            laterList.innerHTML = "";
            laterList.hidden = !laterBookings.length;
            if (!laterBookings.length) {
                if (upcomingEmpty) upcomingEmpty.hidden = false;
            } else {
                if (upcomingEmpty) upcomingEmpty.hidden = true;
                var groups = [];
                laterBookings.forEach(function (b) {
                    var dKey = b.date || "";
                    var last = groups[groups.length - 1];
                    if (!last || last.date !== dKey) {
                        groups.push({ date: dKey, items: [] });
                        last = groups[groups.length - 1];
                    }
                    last.items.push(b);
                });
                groups.forEach(function (g, gIdx) {
                    var section = document.createElement("section");
                    section.className = "bd-bookings-upcoming-day" + (gIdx > 0 ? " mt-4" : "");
                    var h = document.createElement("h3");
                    h.className = "mb-1.5 mt-0 text-xs font-medium text-gray-500";
                    h.textContent = formatBookingsDateHeading(g.date);
                    var ul = document.createElement("ul");
                    ul.className = "bd-bookings-list";
                    ul.setAttribute("aria-label", "Bookings on " + (g.date || ""));
                    g.items.forEach(function (b) {
                        var li = document.createElement("li");
                        li.className = bookingRowClass(b, { variant: "later" });
                        li.innerHTML = bookingRowInnerHtml(b, { variant: "later" });
                        ul.appendChild(li);
                    });
                    section.appendChild(h);
                    section.appendChild(ul);
                    laterList.appendChild(section);
                });
            }
        }
    }

    function parseUsdNumber(raw) {
        if (raw == null || raw === "") return 0;
        var s = String(raw).replace(/[^0-9.-]/g, "");
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    }

    function formatUsd(n) {
        var x = Math.round(n * 100) / 100;
        try {
            return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
        } catch (e) {
            return "$" + x.toFixed(2);
        }
    }

    function findServiceForBooking(booking, services) {
        var list = services || [];
        if (booking.serviceId) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === booking.serviceId) return list[i];
            }
        }
        var name = booking.service;
        if (name) {
            for (var j = 0; j < list.length; j++) {
                if (String(list[j].name) === String(name)) return list[j];
            }
        }
        return null;
    }

    function amountUsdForBooking(booking, services) {
        var svc = findServiceForBooking(booking, services);
        if (!svc) return 0;
        return parseUsdNumber(svc.price);
    }

    function parseIsoParts(iso) {
        var p = String(iso || "").split("-");
        if (p.length !== 3) return null;
        var y = parseInt(p[0], 10);
        var m = parseInt(p[1], 10) - 1;
        var d = parseInt(p[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
        return { y: y, m: m, d: d };
    }

    function isoInCalendarMonth(iso, ref) {
        var parts = parseIsoParts(iso);
        if (!parts) return false;
        return parts.y === ref.getFullYear() && parts.m === ref.getMonth();
    }

    function isoInCalendarYear(iso, ref) {
        var parts = parseIsoParts(iso);
        if (!parts) return false;
        return parts.y === ref.getFullYear();
    }

    var bdEarningsChartInstance = null;
    var bdEarningsChartEscBound = false;

    function computeEarningsChartSeries(state, period) {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth();
        var all = state.upcomingBookings || [];
        var completed = all.filter(bookingIsCompleted);
        var labels = [];
        var values = [];
        if (period === "month") {
            var dim = new Date(y, m + 1, 0).getDate();
            var byDay = {};
            for (var i = 0; i < completed.length; i++) {
                var b = completed[i];
                var dIso = b.date || "";
                if (!isoInCalendarMonth(dIso, now)) continue;
                var amt = amountUsdForBooking(b, state.services);
                byDay[dIso] = (byDay[dIso] || 0) + amt;
            }
            for (var d = 1; d <= dim; d++) {
                var iso = y + "-" + pad2(m + 1) + "-" + pad2(d);
                labels.push(String(d));
                values.push(byDay[iso] || 0);
            }
        } else {
            var sums = [];
            for (var mi = 0; mi < 12; mi++) sums[mi] = 0;
            for (var j = 0; j < completed.length; j++) {
                var bj = completed[j];
                var yIso = bj.date || "";
                if (!isoInCalendarYear(yIso, now)) continue;
                var pr = parseIsoParts(yIso);
                if (!pr) continue;
                sums[pr.m] += amountUsdForBooking(bj, state.services);
            }
            var abbrev = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (var mm = 0; mm < 12; mm++) {
                labels.push(abbrev[mm]);
                values.push(sums[mm]);
            }
        }
        return { labels: labels, values: values };
    }

    function destroyBdEarningsChart() {
        if (bdEarningsChartInstance) {
            bdEarningsChartInstance.destroy();
            bdEarningsChartInstance = null;
        }
    }

    function closeBdEarningsChartModal() {
        var root = $("#bd-earnings-chart-modal");
        if (!root || root.hidden) return;
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        destroyBdEarningsChart();
        try {
            document.body.style.overflow = "";
        } catch (e) {}
    }

    function renderBdEarningsChartInModal(state, period) {
        var wrap = $("#bd-earnings-chart-wrap");
        var canvas = $("#bd-earnings-chart-canvas");
        var emptyP = $("#bd-earnings-chart-empty");
        if (!wrap || !canvas) return;
        destroyBdEarningsChart();
        var all = state.upcomingBookings || [];
        var hasAnyCompleted = all.filter(bookingIsCompleted).length > 0;
        if (!hasAnyCompleted) {
            if (emptyP) {
                emptyP.hidden = false;
                emptyP.textContent =
                    "No completed bookings yet — amounts appear when a booking is marked done.";
            }
            wrap.hidden = true;
            return;
        }
        if (emptyP) emptyP.hidden = true;
        wrap.hidden = false;
        if (typeof Chart === "undefined") {
            if (emptyP) {
                emptyP.hidden = false;
                emptyP.textContent = "Chart library failed to load. Check your network connection.";
            }
            wrap.hidden = true;
            return;
        }
        var series = computeEarningsChartSeries(state, period);
        var primary = "hsl(221, 83%, 53%)";
        var grid = "hsl(215.2941, 27.8689%, 88.0392%)";
        var tick = "hsl(218.8235, 7.9070%, 42.1569%)";
        bdEarningsChartInstance = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: series.labels,
                datasets: [
                    {
                        label: period === "month" ? "Daily earnings (USD)" : "Monthly earnings (USD)",
                        data: series.values,
                        backgroundColor: primary,
                        borderRadius: 6,
                        maxBarThickness: period === "month" ? 14 : 28,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                var v = ctx.parsed && ctx.parsed.y != null ? ctx.parsed.y : ctx.raw;
                                return formatUsd(Number(v) || 0);
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: tick,
                            maxRotation: period === "month" ? 0 : 0,
                            autoSkip: true,
                            maxTicksLimit: period === "month" ? 31 : 12,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        border: { display: false },
                        grid: { color: grid },
                        ticks: {
                            color: tick,
                            callback: function (val) {
                                return formatUsd(Number(val) || 0);
                            },
                        },
                    },
                },
            },
        });
    }

    function openBdEarningsChartModal(state, period) {
        var root = $("#bd-earnings-chart-modal");
        var titleEl = $("#bd-earnings-chart-title");
        var subEl = $("#bd-earnings-chart-subtitle");
        if (!root) return;
        var title = period === "month" ? "This month" : "This year";
        if (titleEl) titleEl.textContent = title;
        if (subEl) {
            subEl.textContent =
                period === "month"
                    ? "Daily earnings from completed bookings in the current calendar month."
                    : "Monthly earnings from completed bookings in the current calendar year.";
        }
        root.hidden = false;
        root.setAttribute("aria-hidden", "false");
        try {
            document.body.style.overflow = "hidden";
        } catch (e) {}
        window.requestAnimationFrame(function () {
            renderBdEarningsChartInModal(state, period);
        });
        var closeBtn = $("#bd-earnings-chart-close");
        if (closeBtn && typeof closeBtn.focus === "function") {
            closeBtn.focus();
        }
    }

    function wireBdEarningsChartModal() {
        var backdrop = $("#bd-earnings-chart-backdrop");
        var closeBtn = $("#bd-earnings-chart-close");
        if (backdrop && !backdrop.getAttribute("data-bd-earnings-chart-wired")) {
            backdrop.setAttribute("data-bd-earnings-chart-wired", "1");
            backdrop.addEventListener("click", function () {
                closeBdEarningsChartModal();
            });
        }
        if (closeBtn && !closeBtn.getAttribute("data-bd-earnings-chart-wired")) {
            closeBtn.setAttribute("data-bd-earnings-chart-wired", "1");
            closeBtn.addEventListener("click", function () {
                closeBdEarningsChartModal();
            });
        }
        if (!bdEarningsChartEscBound) {
            bdEarningsChartEscBound = true;
            document.addEventListener("keydown", function (e) {
                if (e.key !== "Escape") return;
                var m = $("#bd-earnings-chart-modal");
                if (m && !m.hidden) {
                    e.preventDefault();
                    closeBdEarningsChartModal();
                }
            });
        }
    }

    function renderEarnings(state) {
        var todayISO = toISODate(new Date());
        var now = new Date();
        var all = state.upcomingBookings || [];
        var completed = all.filter(bookingIsCompleted);
        var sumToday = 0;
        var sumMonth = 0;
        var sumYear = 0;
        for (var i = 0; i < completed.length; i++) {
            var b = completed[i];
            var amt = amountUsdForBooking(b, state.services);
            var dateISO = b.date || "";
            if (dateISO === todayISO) sumToday += amt;
            if (isoInCalendarMonth(dateISO, now)) sumMonth += amt;
            if (isoInCalendarYear(dateISO, now)) sumYear += amt;
        }

        var elT = $("#bd-earn-sum-today");
        var elM = $("#bd-earn-sum-month");
        var elY = $("#bd-earn-sum-year");
        if (elT) elT.textContent = formatUsd(sumToday);
        if (elM) elM.textContent = formatUsd(sumMonth);
        if (elY) elY.textContent = formatUsd(sumYear);

        var elHomeRev = $("#bd-home-today-revenue");
        if (elHomeRev) elHomeRev.textContent = formatUsd(sumToday);
    }

    var INSIGHTS_DEMO_AVATAR_URLS = [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128&q=80",
    ];

    function reviewerInitial(name) {
        var s = String(name || "").trim();
        if (!s) return "?";
        return s.charAt(0).toUpperCase();
    }

    function insightDemoAvatarUrl(name, index) {
        var acc = (Number(index) || 0) * 13;
        var str = String(name || "");
        for (var i = 0; i < str.length; i++) acc += str.charCodeAt(i);
        var idx = Math.abs(acc) % INSIGHTS_DEMO_AVATAR_URLS.length;
        return INSIGHTS_DEMO_AVATAR_URLS[idx];
    }

    /** Sample reviews for Insights (replace with API data when available). */
    var INSIGHTS_SAMPLE_REVIEWS = [
        {
            name: "Jordan Lee",
            stars: 5,
            comment: "Smooth booking and great service — I will be back.",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
        },
        {
            name: "Priya Desai",
            stars: 5,
            comment: "Professional, on time, and easy to recommend.",
            photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
        },
        {
            name: "Taylor Brooks",
            stars: 4,
            comment: "Lovely experience; more evening slots would be perfect.",
            photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
        },
    ];

    function repeatClientsPercent(bookings) {
        var all = bookings || [];
        var counts = {};
        for (var i = 0; i < all.length; i++) {
            var c = String(all[i].client || "").trim().toLowerCase();
            if (!c) continue;
            counts[c] = (counts[c] || 0) + 1;
        }
        var keys = Object.keys(counts);
        if (!keys.length) return 0;
        var repeaters = 0;
        for (var k = 0; k < keys.length; k++) {
            if (counts[keys[k]] >= 2) repeaters++;
        }
        return Math.round((repeaters / keys.length) * 100);
    }

    function renderInsightStarRow(n) {
        var filled = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
        var bits = ['<span class="bd-insights-stars" role="img" aria-label="' + filled + ' out of 5 stars">'];
        for (var s = 1; s <= 5; s++) {
            bits.push(
                '<span aria-hidden="true" class="' + (s <= filled ? "bd-insights-star--on" : "bd-insights-star--off") + '">★</span>'
            );
        }
        bits.push("</span>");
        return bits.join("");
    }

    function averageInsightStars(reviews) {
        if (!reviews || !reviews.length) return 0;
        var t = 0;
        for (var i = 0; i < reviews.length; i++) t += Number(reviews[i].stars) || 0;
        return t / reviews.length;
    }

    /** Current insight suggestions (stable ids for read/dismiss state). */
    function computeInsightOpportunities(state) {
        var bookings = state.upcomingBookings || [];
        var total = bookings.length;
        var avgStars = averageInsightStars(INSIGHTS_SAMPLE_REVIEWS);
        var raw = [];
        if (!total) {
            raw.push({
                id: "opp_no_bookings",
                title: "No bookings yet",
                description: "Share your listing and keep your availability visible so new clients can book.",
            });
        }
        var imgs = state.listing && Array.isArray(state.listing.images) ? state.listing.images : [];
        if (imgs.length < 2) {
            raw.push({
                id: "opp_add_photos",
                title: "Add more photos",
                description: "Listings with several clear photos tend to get more interest.",
            });
        }
        if ((state.services || []).length < 2) {
            raw.push({
                id: "opp_add_services",
                title: "Add more services",
                description: "Offering more options makes it easier for clients to pick what fits.",
            });
        }
        if (avgStars > 0 && avgStars < 4.8) {
            raw.push({
                id: "opp_improve_rating",
                title: "Improve your rating",
                description: "Respond to reviews and tune the small details clients mention.",
            });
        }
        var seen = {};
        var out = [];
        for (var i = 0; i < raw.length; i++) {
            if (!seen[raw[i].id]) {
                seen[raw[i].id] = true;
                out.push(raw[i]);
            }
        }
        return out;
    }

    function getReadOpportunityIds(state) {
        var L = state.listing;
        if (!L || !Array.isArray(L.readOpportunityIds)) return [];
        return L.readOpportunityIds.filter(function (x) {
            return typeof x === "string" && x;
        });
    }

    function markOpportunityRead(state, id, persist) {
        var L = state.listing;
        if (!L || typeof L !== "object") return;
        if (!Array.isArray(L.readOpportunityIds)) L.readOpportunityIds = [];
        if (L.readOpportunityIds.indexOf(id) === -1) {
            L.readOpportunityIds.push(id);
        }
        persist();
    }

    var opportunitiesNotifyCtx = { state: null, persist: null };

    function renderOpportunityPanelList(state, opps, readIds) {
        var list = $("#bd-opportunities-list");
        var empty = $("#bd-opportunities-empty");
        if (!list || !empty) return;

        if (!opps.length) {
            list.innerHTML = "";
            list.hidden = true;
            empty.hidden = false;
            return;
        }
        empty.hidden = true;
        list.hidden = false;
        list.innerHTML = "";
        for (var i = 0; i < opps.length; i++) {
            (function (opp) {
                var isRead = readIds.indexOf(opp.id) !== -1;
                if (isRead) {
                    var row = document.createElement("div");
                    row.className =
                        "rounded-lg border border-border bg-white p-3 opacity-60";
                    row.innerHTML =
                        '<div class="text-sm font-semibold text-foreground">' +
                        escapeHtml(opp.title) +
                        '</div><p class="mt-1 text-xs leading-snug text-muted-foreground">' +
                        escapeHtml(opp.description) +
                        "</p>";
                    list.appendChild(row);
                } else {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className =
                        "w-full rounded-lg border border-border bg-white p-3 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                    btn.setAttribute("aria-label", opp.title + " — mark as read");
                    btn.innerHTML =
                        '<div class="text-sm font-semibold text-foreground">' +
                        escapeHtml(opp.title) +
                        '</div><p class="mt-1 text-xs leading-snug text-muted-foreground">' +
                        escapeHtml(opp.description) +
                        "</p>";
                    btn.addEventListener("click", function (e) {
                        e.stopPropagation();
                        var st = opportunitiesNotifyCtx.state;
                        var pe = opportunitiesNotifyCtx.persist;
                        if (!st || !pe) return;
                        markOpportunityRead(st, opp.id, pe);
                        renderOpportunityNotifications(st, pe);
                    });
                    list.appendChild(btn);
                }
            })(opps[i]);
        }
    }

    function renderOpportunityNotifications(state, persist) {
        opportunitiesNotifyCtx.state = state;
        opportunitiesNotifyCtx.persist = persist;

        var opps = computeInsightOpportunities(state);
        var readIds = getReadOpportunityIds(state);
        var unread = 0;
        for (var u = 0; u < opps.length; u++) {
            if (readIds.indexOf(opps[u].id) === -1) unread++;
        }

        var badge = $("#bd-opportunities-badge");
        if (badge) {
            if (unread > 0) {
                badge.hidden = false;
                badge.textContent = unread > 99 ? "99+" : String(unread);
            } else {
                badge.hidden = true;
            }
        }

        var overlay = $("#bd-opportunities-overlay");
        var open = overlay && !overlay.classList.contains("hidden");
        if (open) {
            renderOpportunityPanelList(state, opps, readIds);
        }
    }

    function attachOpportunityNotifications() {
        var trigger = $("#bd-opportunities-trigger");
        var overlay = $("#bd-opportunities-overlay");
        var panel = $("#bd-opportunities-panel");
        if (!trigger || !overlay || !panel) return;

        function closeSettingsMenu() {
            var dd = $("#bd-settings-dropdown");
            var st = $("#bd-settings-trigger");
            if (dd && !dd.classList.contains("hidden")) {
                dd.classList.add("hidden");
                if (st) st.setAttribute("aria-expanded", "false");
            }
        }

        function closeOpp() {
            overlay.classList.add("hidden");
            overlay.setAttribute("aria-hidden", "true");
            trigger.setAttribute("aria-expanded", "false");
        }

        function openOpp() {
            closeSettingsMenu();
            overlay.classList.remove("hidden");
            overlay.setAttribute("aria-hidden", "false");
            trigger.setAttribute("aria-expanded", "true");
            var st = opportunitiesNotifyCtx.state;
            if (st) {
                renderOpportunityPanelList(st, computeInsightOpportunities(st), getReadOpportunityIds(st));
            }
            try {
                panel.focus();
            } catch (eF) {}
        }

        function isOpen() {
            return !overlay.classList.contains("hidden");
        }

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            if (isOpen()) closeOpp();
            else openOpp();
        });

        overlay.addEventListener("click", function (e) {
            if (!panel.contains(e.target)) closeOpp();
        });

        panel.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && isOpen()) closeOpp();
        });
    }

    function renderInsights(state) {
        var bookings = state.upcomingBookings || [];
        var total = bookings.length;
        var avgStars = averageInsightStars(INSIGHTS_SAMPLE_REVIEWS);
        var repeatPct = repeatClientsPercent(bookings);

        var elBook = $("#bd-insights-stat-bookings");
        var elRate = $("#bd-insights-stat-rating");
        var elRepeat = $("#bd-insights-stat-repeat");
        if (elBook) elBook.textContent = String(total);
        if (elRate) elRate.textContent = avgStars > 0 ? avgStars.toFixed(1) : "—";
        if (elRepeat) elRepeat.textContent = String(repeatPct) + "%";

        var reviewsUl = $("#bd-insights-reviews-list");
        var reviewsEmpty = $("#bd-insights-reviews-empty");
        if (reviewsUl) {
            reviewsUl.innerHTML = "";
            if (!INSIGHTS_SAMPLE_REVIEWS.length) {
                if (reviewsEmpty) reviewsEmpty.hidden = false;
            } else {
                if (reviewsEmpty) reviewsEmpty.hidden = true;
                for (var r = 0; r < INSIGHTS_SAMPLE_REVIEWS.length; r++) {
                    var rv = INSIGHTS_SAMPLE_REVIEWS[r];
                    var li = document.createElement("li");
                    li.className = "bd-insights-review";
                    var photo = rv.photo ? String(rv.photo).trim() : "";
                    if (!photo) photo = insightDemoAvatarUrl(rv.name, r);
                    var initial = escapeHtml(reviewerInitial(rv.name));
                    var photoAttr = escapeAttr(photo);
                    li.innerHTML =
                        '<div class="bd-insights-review__head">' +
                        '<div class="bd-insights-review__author">' +
                        '<span class="bd-insights-review__avatar">' +
                        '<img class="bd-insights-review__avatar-img" src="' +
                        photoAttr +
                        '" alt="" loading="lazy" decoding="async" onerror="this.classList.add(\'bd-insights-review__avatar-img--hidden\');this.nextElementSibling.classList.add(\'bd-insights-review__avatar-fallback--show\');" />' +
                        '<span class="bd-insights-review__avatar-fallback" aria-hidden="true">' +
                        initial +
                        "</span>" +
                        "</span>" +
                        '<span class="bd-insights-review__name">' +
                        escapeHtml(rv.name) +
                        "</span>" +
                        "</div>" +
                        renderInsightStarRow(rv.stars) +
                        "</div>" +
                        '<p class="bd-insights-review__comment">' +
                        escapeHtml(rv.comment) +
                        "</p>";
                    reviewsUl.appendChild(li);
                }
            }
        }

    }

    /** When set, Schedule nav refreshes selects + editor + calendar (after session init). */
    var dashboardScheduleNavHandler = { fn: null };

    function attachNavAndHashListeners() {
        if (attachNavAndHashListeners.did) return;
        attachNavAndHashListeners.did = true;
        $all("[data-bd-nav]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                var id = btn.getAttribute("data-bd-nav");
                if (!id) return;
                applyDashboardUrl(id);
                setActiveNav("#" + id);
                if (id === "schedule" && dashboardScheduleNavHandler.fn) {
                    dashboardScheduleNavHandler.fn();
                }
            });
        });
        $all("[data-bd-home-nav]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                var id = btn.getAttribute("data-bd-home-nav");
                if (!id || !DASHBOARD_ROUTE_KEYS[id]) return;
                applyDashboardUrl(id);
                setActiveNav("#" + id);
                if (id === "schedule" && dashboardScheduleNavHandler.fn) {
                    dashboardScheduleNavHandler.fn();
                }
            });
        });
        function goDashboardSection(id) {
            if (!id || !DASHBOARD_ROUTE_KEYS[id]) return;
            applyDashboardUrl(id);
            setActiveNav("#" + id);
            if (id === "schedule" && dashboardScheduleNavHandler.fn) {
                dashboardScheduleNavHandler.fn();
            }
        }
        $all("[data-bd-quick]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                goDashboardSection(btn.getAttribute("data-bd-quick"));
            });
        });
        var homeViewSchedule = $("#bd-home-view-schedule");
        if (homeViewSchedule) {
            homeViewSchedule.addEventListener("click", function (e) {
                e.preventDefault();
                goDashboardSection("schedule");
            });
        }
        var backToDash = $("#bd-back-to-dashboard");
        if (backToDash) {
            backToDash.addEventListener("click", function (e) {
                e.preventDefault();
                applyDashboardUrl("home");
                setActiveNav("#home");
            });
        }
        window.addEventListener("hashchange", function () {
            setActiveNav();
        });
        window.addEventListener("popstate", function () {
            setActiveNav();
        });
        setActiveNav();
    }

    function init() {
        var path = window.location.pathname || "";
        if (!path.includes("business-dashboard.html")) {
            return;
        }
        var A = auth();
        var session =
            A && typeof A.readSession === "function" ? A.readSession() : null;
        if (!session) {
            try {
                var destLogin = "index.html?businessAuth=1";
                var hrefNow = String(window.location.href || "");
                var pathNow = (window.location.pathname || "").replace(/\/+$/, "") || "/";
                var onIndexAlready =
                    pathNow === "/" ||
                    /index\.html$/i.test(pathNow);
                var alreadyLoginUrl =
                    onIndexAlready && (window.location.search || "").indexOf("businessAuth=1") !== -1;
                if (!alreadyLoginUrl && hrefNow.indexOf("businessAuth=1") === -1) {
                    // window.location.href = destLogin;
                }
            } catch (eRedir) {
                // window.location.href = "index.html?businessAuth=1";
            }
            return;
        }

        dashboardSessionIsBusiness = session.role === "business";

        var state = loadState(session.email);
        var email = session.email;

        function persist() {
            saveState(email, state);
        }

        resolveListingSelection(state, persist, function runDashboardMain() {
        var SHORT_MONTHS = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        function monthShort(d) {
            return SHORT_MONTHS[d.getMonth()];
        }

        function dayKeyToAbbrev(key) {
            for (var i = 0; i < DAYS.length; i++) {
                if (DAYS[i].key === key) return DAYS[i].label.slice(0, 3);
            }
            return key;
        }

        function parseISODateLocal(iso) {
            var p = String(iso).split("-");
            if (p.length !== 3) return new Date();
            return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        }

        var calUi = {
            weekStart: startOfWeekMonday(new Date()),
            selectedDate: new Date(),
            pickedTime: null,
        };

        function clampSelectionToWeek() {
            var w0 = toISODate(calUi.weekStart);
            var w6 = toISODate(addDays(calUi.weekStart, 6));
            var s = toISODate(calUi.selectedDate);
            if (s < w0 || s > w6) {
                calUi.selectedDate = new Date(
                    calUi.weekStart.getFullYear(),
                    calUi.weekStart.getMonth(),
                    calUi.weekStart.getDate()
                );
            }
        }

        function renderCalendarWidget() {
            var monthLabel = $("#bd-cal-month-label");
            var daysWrap = $("#bd-cal-days");
            var slotsWrap = $("#bd-cal-slots");
            var emptyEl = $("#bd-cal-slots-empty");
            var dateLabel = $("#bd-cal-slots-date");
            var schedSvcSel = $("#bd-schedule-service");
            if (!monthLabel || !daysWrap || !slotsWrap || !dateLabel) return;

            var svcId =
                schedSvcSel && schedSvcSel.value ? schedSvcSel.value : state.services[0] && state.services[0].id;
            var svc = state.services.find(function (s) {
                return s.id === svcId;
            });
            if (!svc) return;

            var wEnd = addDays(calUi.weekStart, 6);
            monthLabel.textContent =
                monthShort(calUi.weekStart) +
                " " +
                calUi.weekStart.getDate() +
                " – " +
                monthShort(wEnd) +
                " " +
                wEnd.getDate() +
                ", " +
                wEnd.getFullYear();

            daysWrap.innerHTML = "";
            var today = new Date();
            for (var di = 0; di < 7; di++) {
                var dCell = addDays(calUi.weekStart, di);
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "bd-cal__day";
                btn.setAttribute("data-cal-date", toISODate(dCell));
                if (sameLocalDate(dCell, today)) btn.classList.add("bd-cal__day--today");
                if (sameLocalDate(dCell, calUi.selectedDate)) btn.classList.add("bd-cal__day--selected");
                btn.innerHTML =
                    '<span class="bd-cal__day-num">' +
                    dCell.getDate() +
                    '</span><span class="bd-cal__day-sub">' +
                    escapeHtml(dayKeyToAbbrev(dateToDayKey(dCell))) +
                    "</span>";
                daysWrap.appendChild(btn);
            }

            var dayKey = dateToDayKey(calUi.selectedDate);
            var row = svc.schedule[dayKey] || defaultDay();
            var dateISO = toISODate(calUi.selectedDate);
            try {
                dateLabel.textContent = calUi.selectedDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            } catch (e) {
                dateLabel.textContent = dateISO;
            }

            slotsWrap.innerHTML = "";
            var step = svc.durationMin != null && svc.durationMin > 0 ? svc.durationMin : 30;
            var slots = row.enabled ? buildSlotsForDay(row.start, row.end, step) : [];

            if (!slots.length) {
                if (emptyEl) emptyEl.hidden = false;
            } else {
                if (emptyEl) emptyEl.hidden = true;
                slots.forEach(function (slot) {
                    var booked = slotBlockedByBookings(dateISO, slot, step, state.upcomingBookings, state.services);
                    var bSlot = document.createElement("button");
                    bSlot.type = "button";
                    bSlot.setAttribute("role", "listitem");
                    bSlot.setAttribute("data-slot", slot);
                    bSlot.textContent = slot;
                    if (booked) {
                        bSlot.className = "bd-cal__slot bd-cal__slot--booked";
                        bSlot.disabled = true;
                        bSlot.setAttribute("aria-label", slot + ", booked");
                    } else {
                        bSlot.className = "bd-cal__slot bd-cal__slot--avail";
                        if (calUi.pickedTime === slot) bSlot.classList.add("bd-cal__slot--picked");
                        bSlot.setAttribute("aria-label", slot + ", available");
                    }
                    slotsWrap.appendChild(bSlot);
                });
            }
        }

        function refreshAll() {
            renderOverview(session, state);
            renderMyListings(state);
            renderServiceRows(state, {
                onEdit: function (id) {
                    var svc = state.services.find(function (s) {
                        return s.id === id;
                    });
                    if (!svc) return;
                    openServiceModal("edit", svc, function (payload) {
                        svc.name = payload.name;
                        svc.durationMin = payload.durationMin;
                        svc.price = payload.price;
                        persist();
                        refreshAll();
                    });
                },
                onDelete: function (id) {
                    if (!window.confirm("Remove this service?")) return;
                    state.services = state.services.filter(function (s) {
                        return s.id !== id;
                    });
                    (state.staff || []).forEach(function (m) {
                        m.serviceIds = (m.serviceIds || []).filter(function (sid) {
                            return sid !== id;
                        });
                    });
                    if (!state.services.length) {
                        state.services.push({
                            id: uid(),
                            name: "New service",
                            durationMin: 30,
                            price: null,
                            schedule: defaultSchedule(),
                        });
                    }
                    persist();
                    refreshAll();
                },
            });
            renderStaffPanel(state);
            var schedEl = $("#bd-schedule-service");
            var currentSvc =
                (schedEl && schedEl.value) || (state.services[0] && state.services[0].id);
            fillServiceSelects(state, currentSvc);
            renderScheduleEditor(state, $("#bd-schedule-service").value);
            renderCalendarWidget();
            renderBookings(state);
            renderEarnings(state);
            renderInsights(state);
            renderOpportunityNotifications(state, persist);
            renderListingSwitcher(state);
        }

        var userLabel = $("#bd-session-email");
        if (userLabel) userLabel.textContent = session.email;

        var addSvc = $("#bd-add-service");
        if (addSvc)
            addSvc.addEventListener("click", function () {
                openServiceModal("add", null, function (payload) {
                    state.services.push({
                        id: uid(),
                        name: payload.name,
                        durationMin: payload.durationMin,
                        price: payload.price,
                        schedule: defaultSchedule(),
                    });
                    persist();
                    refreshAll();
                });
            });

        var homeAddListing = $("#bd-home-add-listing-card");
        if (homeAddListing)
            homeAddListing.addEventListener("click", function (e) {
                e.preventDefault();
                startAddNewListing(state, persist, refreshAll);
            });

        listingRouteHooks.onEnterAddListing = function () {
            populateListingFormPage(state);
        };
        listingRouteHooks.onEnterMyListings = function () {
            renderMyListings(state);
        };
        bindListingFormPage(session, state, persist, refreshAll);
        bindBusinessPhotoLightbox();

        var myListingsPanel = $("#bd-panel-my-listings");
        if (myListingsPanel && !myListingsPanel.getAttribute("data-bd-listing-delegated")) {
            myListingsPanel.setAttribute("data-bd-listing-delegated", "1");
            myListingsPanel.addEventListener("click", function (e) {
                var editBtn = e.target.closest("[data-bd-edit-listing]");
                if (editBtn) {
                    var lid = editBtn.getAttribute("data-bd-edit-listing");
                    var L = (state.listings || []).find(function (l) {
                        return l.id === lid;
                    });
                    if (!L) return;
                    flushOperationalDataToActiveListing(state);
                    state.activeListingId = lid;
                    state.listing = L;
                    applyDashboardDataFromActiveListing(state);
                    persist();
                    refreshAll();
                    goAddListing();
                    return;
                }
                if (e.target.closest("[data-bd-add-new-listing]")) {
                    startAddNewListing(state, persist, refreshAll);
                    return;
                }
            });
        }

        var schedSel = $("#bd-schedule-service");
        if (schedSel)
            schedSel.addEventListener("change", function () {
                renderScheduleEditor(state, schedSel.value);
                renderCalendarWidget();
            });

        var schedSave = $("#bd-schedule-save");
        if (schedSave)
            schedSave.addEventListener("click", function () {
                var sel = $("#bd-schedule-service");
                var id = sel ? sel.value : null;
                var svc = state.services.find(function (s) {
                    return s.id === id;
                });
                if (!svc) return;
                svc.schedule = readScheduleFromDom();
                persist();
                renderCalendarWidget();
                window.alert("Schedule saved for " + svc.name + ".");
            });

        wireBdEarningsChartModal();
        var cardMonth = $("#bd-earn-card-month");
        var cardYear = $("#bd-earn-card-year");
        function openMonthChart() {
            openBdEarningsChartModal(state, "month");
        }
        function openYearChart() {
            openBdEarningsChartModal(state, "year");
        }
        if (cardMonth && !cardMonth.getAttribute("data-bd-earn-chart")) {
            cardMonth.setAttribute("data-bd-earn-chart", "1");
            cardMonth.addEventListener("click", openMonthChart);
            cardMonth.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openMonthChart();
                }
            });
        }
        if (cardYear && !cardYear.getAttribute("data-bd-earn-chart")) {
            cardYear.setAttribute("data-bd-earn-chart", "1");
            cardYear.addEventListener("click", openYearChart);
            cardYear.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openYearChart();
                }
            });
        }

        var calWidget = $("#bd-calendar-widget");
        if (calWidget) {
            calWidget.addEventListener("click", function (e) {
                var dayBtn = e.target.closest("[data-cal-date]");
                if (dayBtn) {
                    var iso = dayBtn.getAttribute("data-cal-date");
                    calUi.selectedDate = parseISODateLocal(iso);
                    calUi.pickedTime = null;
                    renderCalendarWidget();
                    return;
                }
                var slotBtn = e.target.closest(".bd-cal__slot--avail[data-slot]");
                if (slotBtn) {
                    var t = slotBtn.getAttribute("data-slot");
                    calUi.pickedTime = calUi.pickedTime === t ? null : t;
                    renderCalendarWidget();
                }
            });
        }

        var prevW = $("#bd-cal-prev-week");
        if (prevW)
            prevW.addEventListener("click", function () {
                calUi.weekStart = addDays(calUi.weekStart, -7);
                clampSelectionToWeek();
                renderCalendarWidget();
            });
        var nextW = $("#bd-cal-next-week");
        if (nextW)
            nextW.addEventListener("click", function () {
                calUi.weekStart = addDays(calUi.weekStart, 7);
                clampSelectionToWeek();
                renderCalendarWidget();
            });

        dashboardScheduleNavHandler.fn = function () {
            fillServiceSelects(state, null);
            renderScheduleEditor(state, $("#bd-schedule-service").value);
            renderCalendarWidget();
        };

        wireListingSwitcher(state, persist, refreshAll);

        function wireStaffControlsOnce() {
            if (wireStaffControlsOnce.did) return;
            wireStaffControlsOnce.did = true;
            var root = $("#bd-panel-staff");
            if (!root) return;
            root.addEventListener("change", function (e) {
                var t = e.target;
                if (!t || !t.id) return;
                if (t.id === "bd-staff-section-enabled") {
                    state.staffSectionEnabled = !!t.checked;
                    persist();
                    return;
                }
                if (t.id === "bd-staff-booking-enabled") {
                    state.staffBookingEnabled = !!t.checked;
                    persist();
                    return;
                }
                if (t.id === "bd-staff-section-title") {
                    state.staffSectionTitle = String(t.value || "").trim() || "Staff";
                    persist();
                }
            });
            root.addEventListener("click", function (e) {
                var btn = e.target.closest("[data-staff-action]");
                if (!btn) return;
                var sid = btn.getAttribute("data-staff-id");
                var act = btn.getAttribute("data-staff-action");
                if (act === "edit") {
                    var mem = (state.staff || []).find(function (x) {
                        return x.id === sid;
                    });
                    if (!mem) return;
                    openStaffModal("edit", mem, state.services, function (payload) {
                        mem.name = payload.name;
                        mem.role = payload.role;
                        mem.description = payload.description;
                        mem.photo = payload.photo;
                        mem.serviceIds = payload.serviceIds;
                        mem.bookable = payload.bookable;
                        persist();
                        refreshAll();
                    });
                }
                if (act === "del") {
                    if (!window.confirm("Remove this staff member?")) return;
                    state.staff = (state.staff || []).filter(function (x) {
                        return x.id !== sid;
                    });
                    persist();
                    refreshAll();
                }
            });
        }
        wireStaffControlsOnce();

        var addStaffBtn = $("#bd-add-staff");
        if (addStaffBtn && !addStaffBtn.getAttribute("data-bd-bound")) {
            addStaffBtn.setAttribute("data-bd-bound", "1");
            addStaffBtn.addEventListener("click", function () {
                if (!state.services.length) {
                    window.alert("Add at least one service before linking staff.");
                    return;
                }
                openStaffModal("add", null, state.services, function (payload) {
                    state.staff = state.staff || [];
                    state.staff.push({
                        id: staffUid(),
                        name: payload.name,
                        role: payload.role,
                        description: payload.description,
                        photo: payload.photo,
                        serviceIds: payload.serviceIds,
                        bookable: payload.bookable,
                    });
                    persist();
                    refreshAll();
                });
            });
        }

        refreshAll();
        attachNavAndHashListeners();
        },
            email
        );
    }

    /** Log out always works (even when session/auth init fails). */
    function attachLogoutListener() {
        var A = auth();
        var logoutBtn = $("#bd-logout-btn");
        if (!logoutBtn) return;
        logoutBtn.addEventListener("click", function () {
            try {
                var s = A && typeof A.readSession === "function" ? A.readSession() : null;
                var em = s && s.email;
                if (em) sessionStorage.removeItem(listingPickerSessionStorageKey(em));
            } catch (eS) {}
            try {
                localStorage.removeItem("role");
            } catch (e) {}
            if (A && typeof A.clearSession === "function") {
                A.clearSession();
            }
            // window.location.href = "index.html";
        });
    }

    function attachSettingsMenu() {
        var wrap = $("#bd-settings-menu-wrap");
        var trigger = $("#bd-settings-trigger");
        var dd = $("#bd-settings-dropdown");
        if (!wrap || !trigger || !dd) return;

        function closeMenu() {
            dd.classList.add("hidden");
            trigger.setAttribute("aria-expanded", "false");
        }

        function openMenu() {
            dd.classList.remove("hidden");
            trigger.setAttribute("aria-expanded", "true");
        }

        function isOpen() {
            return !dd.classList.contains("hidden");
        }

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            if (isOpen()) closeMenu();
            else openMenu();
        });

        document.addEventListener("click", function () {
            closeMenu();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeMenu();
        });

        dd.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }

    var dashboardDomBooted = false;
    function bootDashboard() {
        if (dashboardDomBooted) return;
        dashboardDomBooted = true;
        attachOpportunityNotifications();
        attachSettingsMenu();
        attachLogoutListener();
        init();
    }

    document.addEventListener("DOMContentLoaded", bootDashboard);
    if (document.readyState !== "loading") {
        bootDashboard();
    }
})();
