/**
 * Canonical business directory for business detail pages.
 * Add rows here — the detail page template reads everything from this data.
 */

import { defaultWeeklySchedule, toISODate } from "./bookingSlots.js";
import { demoListingImageUrls, flattenDemoListingRows } from "./demo/categoryDemoListings.js";
import { haversineKm } from "./geoDistance.js";

/*
 * Registry rows (reviews, services, staff, schedules, etc.) are plain objects.
 * See resolveBusiness() for the shape exposed to the UI.
 */

const DEFAULT_WEEKLY_SCHEDULE = defaultWeeklySchedule();
const DEFAULT_CATEGORY_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1600&q=80";

const COVER_BY_CATEGORY = {
  Barbershop:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80",
  HairSalon:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
  Spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80",
  Fitness:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
  Nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1600&q=80",
  Dentist:
    "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=80",
  Dermatology:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1600&q=80",
  Physiotherapy:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1600&q=80",
  TattooStudios:
    "https://images.unsplash.com/photo-1611241893603-3c359704e0ee?auto=format&fit=crop&w=1600&q=80",
  CarDetailing:
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=80",
  PhotographySessions:
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
  Taxi: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80",
};

/** Demo rows from `demo/categoryDemoListings.js` (per-category bundles). Taxi stays here until API wiring. */
const TAXI_DEMO_ROWS = [
  {
    id: "pdx-cityride",
    name: "PDX CityRide",
    description: "Metro · On-demand rides & scheduled pickups",
    category: "Taxi",
    city: "Portland",
    coverImage: COVER_BY_CATEGORY.Taxi,
    images: [
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376763036-066120522c35?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511910849309-0dffbabc57a0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1448682398290-d18e9699ac6d?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    id: "capitol-car-service",
    name: "Capitol Car Service",
    description: "Seattle · Black car & point-to-point",
    category: "Taxi",
    city: "Seattle",
    coverImage:
      "https://images.unsplash.com/photo-1544620347-c4fd0a55d766?auto=format&fit=crop&w=1600&q=80",
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd0a55d766?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489821584268-5f0a627fe781?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

/** Homepage + explore + detail registry — ids must match `slugifyName(card title)` / `data-business-id` in the DOM. */
export const BUSINESS_ROWS = [
  ...flattenDemoListingRows(),
  ...TAXI_DEMO_ROWS,
];

const BY_ID = Object.fromEntries(BUSINESS_ROWS.map((r) => [r.id, r]));

/** Slug used in URLs — must match listing card titles after normalizing `&` → `and`. */
export function slugifyName(name) {
  return name
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Stable business id for a listing card in the DOM (matches `placeCardNav` / URL slugs).
 * @param {Element | null | undefined} card
 * @returns {string | null}
 */
export function resolveBusinessIdFromListingCard(card) {
  if (!card || !card.getAttribute) return null;
  const explicit = card.getAttribute("data-business-id")?.trim();
  if (explicit) {
    if (BY_ID[explicit]) return explicit;
    return explicit;
  }
  const nameEl = card.querySelector(".place-card__name");
  const raw = nameEl?.textContent?.trim().replace(/\s+/g, " ");
  if (!raw) return null;
  const fromTitle = slugifyName(raw);
  if (BY_ID[fromTitle]) return fromTitle;
  const byRowName = BUSINESS_ROWS.find((r) => slugifyName(r.name) === fromTitle);
  return byRowName?.id ?? fromTitle;
}

export function getRouterBasename() {
  const raw = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL;
  if (!raw || raw === "/" || raw === "./") return undefined;
  const s = String(raw).replace(/\/$/, "");
  return s || undefined;
}

/** Absolute or base-prefixed path to the React business detail route (`/business/:id`). */
export function businessPath(id) {
  const enc = encodeURIComponent(id);
  const base = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL;
  const raw = base ? String(base) : "/";
  if (raw === "/" || raw === "./") return `/business/${enc}`;
  const p = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return `${p}/business/${enc}`;
}

/** Preferred card destination for listing cards. */
export function businessDestinationUrl(id) {
  return `/business/${encodeURIComponent(id)}`;
}

export function homePath() {
  const base = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL;
  const raw = base ? String(base) : "/";
  if (raw === "./") return "./";
  return raw;
}

/** Resolves to the site home (works with `base: './'` and subpath deploys). */
export function homeHref() {
  if (typeof window === "undefined") return "/";
  const raw =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL
      ? String(import.meta.env.BASE_URL)
      : "/";
  if (raw === "./") {
    try {
      return new URL("../index.html", window.location.href).href;
    } catch {
      return "/index.html";
    }
  }
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/**
 * Primary `?category=` slug for unified search (`/search?category=`).
 * Aliases (legacy short slugs) are accepted in `exploreSlugToCanonicalCategory`.
 */
const SEARCH_SLUG_BY_CANONICAL = {
  Barbershop: "barbershop",
  HairSalon: "hair-salon",
  Spa: "spa",
  Nails: "nails",
  Fitness: "fitness",
  Dentist: "dentist",
  Dermatology: "dermatology",
  Physiotherapy: "physiotherapy",
  TattooStudios: "tattoo-studios",
  CarDetailing: "car-detailing",
  PhotographySessions: "photography-sessions",
  Taxi: "taxi",
};

const CANONICAL_BY_SLUG_ALIAS = {
  barbershop: "Barbershop",
  barber: "Barbershop",
  "hair-salon": "HairSalon",
  hairsalon: "HairSalon",
  hair: "HairSalon",
  salon: "HairSalon",
  spa: "Spa",
  nails: "Nails",
  beauty: "Nails",
  fitness: "Fitness",
  gym: "Fitness",
  dentist: "Dentist",
  dentistry: "Dentist",
  dental: "Dentist",
  dermatology: "Dermatology",
  derm: "Dermatology",
  skin: "Dermatology",
  physiotherapy: "Physiotherapy",
  physio: "Physiotherapy",
  "physical-therapy": "Physiotherapy",
  tattoo: "TattooStudios",
  tattoos: "TattooStudios",
  "tattoo-studio": "TattooStudios",
  "tattoo-studios": "TattooStudios",
  detailing: "CarDetailing",
  "car-detailing": "CarDetailing",
  "auto-detailing": "CarDetailing",
  photography: "PhotographySessions",
  photographer: "PhotographySessions",
  "photo-session": "PhotographySessions",
  "photography-sessions": "PhotographySessions",
  taxi: "Taxi",
};

/** @param {string} slug e.g. `barbershop` or legacy `barber` */
export function exploreSlugToCanonicalCategory(slug) {
  const s = String(slug || "")
    .trim()
    .toLowerCase();
  return CANONICAL_BY_SLUG_ALIAS[s] || "";
}

/** @param {string} canonicalCategory */
export function searchSlugForCanonicalCategory(canonicalCategory) {
  return SEARCH_SLUG_BY_CANONICAL[canonicalCategory] || "";
}

/** Href to unified search results (`/search?category=`). */
export function categoryPageHrefForSlug(slug) {
  const q = slug ? `?category=${encodeURIComponent(slug)}` : "";
  const base = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL;
  const raw = base ? String(base) : "/";
  if (raw === "/" || raw === "./") {
    return `/search${q}`;
  }
  const p = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return `${p}/search${q}`;
}

/** @param {string} canonicalCategory */
export function categoryPageHrefForCanonicalCategory(canonicalCategory) {
  const u = searchSlugForCanonicalCategory(canonicalCategory);
  if (!u) {
    const base = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL;
    const raw = base ? String(base) : "/";
    if (raw === "/" || raw === "./") return "/search";
    const p = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    return `${p}/search`;
  }
  return categoryPageHrefForSlug(u);
}

/** @param {string} canonicalCategory from the row category field */
export function exploreHrefForCanonicalCategory(canonicalCategory) {
  const slug = searchSlugForCanonicalCategory(canonicalCategory);
  if (!slug) return "/explore";
  return `/explore?category=${encodeURIComponent(slug)}`;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** @param {Object} row */
function defaultGalleryImages(row) {
  const cat = row.category;
  const id = row.id;
  if (cat && id) {
    const urls = demoListingImageUrls(String(cat), String(id), 0);
    if (urls.length) return urls;
  }
  const primary = row.coverImage ?? COVER_BY_CATEGORY[row.category] ?? DEFAULT_CATEGORY_FALLBACK_IMAGE;
  return primary ? [primary] : [];
}

function defaultServices(row) {
  const cat = row.category;
  if (cat === "Barbershop") {
    return [
      { name: "Signature cut", duration: "45 min", price: "$55", staffName: "Alex" },
      { name: "Cut + hot towel shave", duration: "60 min", price: "$72", staffName: "Jordan" },
      { name: "Beard sculpt & lineup", duration: "30 min", price: "$38", staffName: "Sam" },
    ];
  }
  if (cat === "HairSalon") {
    return [
      { name: "Cut & style", duration: "60 min", price: "$85", staffName: "Jordan" },
      { name: "Color touch-up", duration: "90 min", price: "$140", staffName: "Riley" },
      { name: "Blowout", duration: "45 min", price: "$55", staffName: "Sam" },
    ];
  }
  if (cat === "Spa") {
    return [
      { name: "Therapeutic massage", duration: "60 min", price: "$110", staffName: "Maya" },
      { name: "Facial glow treatment", duration: "50 min", price: "$95", staffName: "Riley" },
      { name: "Recovery add-on", duration: "20 min", price: "$35", staffName: "Chris" },
    ];
  }
  if (cat === "Nails") {
    return [
      { name: "Gel manicure", duration: "45 min", price: "$52", staffName: "Min" },
      { name: "Deluxe pedicure", duration: "55 min", price: "$68", staffName: "Ava" },
      { name: "Nail art session", duration: "40 min", price: "$45", staffName: "Lee" },
    ];
  }
  if (cat === "Fitness") {
    return [
      { name: "Drop-in class", duration: "50 min", price: "$28", staffName: "Class coaches" },
      { name: "Personal training", duration: "60 min", price: "$85", staffName: "Taylor" },
      { name: "Intro assessment", duration: "30 min", price: "Free", staffName: "Front desk" },
    ];
  }
  if (cat === "Dentist") {
    return [
      { name: "Cleaning & exam", duration: "60 min", price: "$165", staffName: "Hygienist" },
      { name: "Whitening session", duration: "75 min", price: "$395", staffName: "Dr. Patel" },
      { name: "Consultation", duration: "30 min", price: "Free", staffName: "Front desk" },
    ];
  }
  if (cat === "Dermatology") {
    return [
      { name: "Skin check", duration: "30 min", price: "$120", staffName: "Dr. Chen" },
      { name: "Acne follow-up", duration: "20 min", price: "$85", staffName: "PA Morgan" },
      { name: "Cosmetic consult", duration: "45 min", price: "$150", staffName: "Dr. Chen" },
    ];
  }
  if (cat === "Physiotherapy") {
    return [
      { name: "Initial physio assessment", duration: "50 min", price: "$95", staffName: "Lead physio" },
      { name: "Sports rehab session", duration: "60 min", price: "$110", staffName: "Sports specialist" },
      { name: "Posture & mobility tune-up", duration: "40 min", price: "$80", staffName: "Therapy team" },
    ];
  }
  if (cat === "TattooStudios") {
    return [
      { name: "Tattoo consult", duration: "30 min", price: "Free", staffName: "Artist" },
      { name: "Fine-line tattoo session", duration: "90 min", price: "From $180", staffName: "Senior artist" },
      { name: "Touch-up session", duration: "45 min", price: "$70", staffName: "Studio team" },
    ];
  }
  if (cat === "CarDetailing") {
    return [
      { name: "Express interior detail", duration: "60 min", price: "$89", staffName: "Detail crew" },
      { name: "Full detail package", duration: "150 min", price: "$220", staffName: "Master detailer" },
      { name: "Paint protection refresh", duration: "90 min", price: "$160", staffName: "Coating specialist" },
    ];
  }
  if (cat === "PhotographySessions") {
    return [
      { name: "Portrait session", duration: "60 min", price: "$140", staffName: "Photographer" },
      { name: "Couples mini session", duration: "45 min", price: "$120", staffName: "Photographer" },
      { name: "Event coverage consult", duration: "30 min", price: "Free", staffName: "Studio coordinator" },
    ];
  }
  if (cat === "Taxi") {
    return [
      { name: "Airport transfer", duration: "Varies", price: "From $65", staffName: "Dispatch" },
      { name: "Point-to-point ride", duration: "Varies", price: "Meter + booking", staffName: "Chauffeur pool" },
      { name: "Hourly charter", duration: "2 hr min", price: "$95/hr", staffName: "Dispatch" },
    ];
  }
  return [
    { name: "Standard visit", duration: "45 min", price: "$60", staffName: "Staff" },
    { name: "Extended session", duration: "75 min", price: "$95", staffName: "Staff" },
  ];
}

function defaultReviews(row) {
  const h = hashString(row.id);
  const pool = [
    { userName: "Jamie L.", rating: 5, comment: "Easy to book and the staff was welcoming. Will return." },
    { userName: "Priya K.", rating: 5, comment: "Exactly what I needed — punctual, professional, great vibe." },
    { userName: "Marcus T.", rating: 4, comment: "Solid experience overall. Minor wait at check-in." },
    { userName: "Elena R.", rating: 5, comment: "Loved the attention to detail. Feels premium without being fussy." },
    { userName: "Noah S.", rating: 4, comment: "Great value for the area. Booking was straightforward." },
  ];
  const i0 = h % pool.length;
  const i1 = (h + 2) % pool.length;
  const i2 = (h + 4) % pool.length;
  return [pool[i0], pool[i1], pool[i2]];
}

/** Demo bookings for the public booking panel (interval overlap). Times are local “today”. */
function defaultDemoCalendarBookings(rowId) {
  const todayISO = toISODate(new Date());
  const h = hashString(rowId);
  const pair = [
    { date: todayISO, startTime: "10:00", endTime: "10:50", status: "scheduled" },
    { date: todayISO, startTime: "14:00", endTime: "14:30", status: "scheduled" },
  ];
  return h % 3 === 0 ? [pair[0]] : pair;
}

/** Deterministic lat/lng + street line from `row` so every listing has map data without per-row literals in the UI. */
function defaultLocation(row) {
  const city = row.city ?? "Portland";
  const state = city === "Seattle" ? "WA" : "OR";
  const h = hashString(row.id);

  const cityCenters = {
    Portland: { lat: 45.5152, lng: -122.6784 },
    Seattle: { lat: 47.6062, lng: -122.3321 },
    Tirana: { lat: 41.3275, lng: 19.8187 },
  };
  const base = cityCenters[city] ?? cityCenters.Portland;

  const latOffset = ((h % 201) - 100) * 0.00018;
  const lngOffset = (((h >>> 3) % 201) - 100) * 0.00022;
  const lat = Number((base.lat + latOffset).toFixed(6));
  const lng = Number((base.lng + lngOffset).toFixed(6));

  const streets =
    city === "Tirana"
      ? [
          "Rruga Ismail Qemali 15",
          "Bulevardi Bajram Curri 108",
          "Rruga e Barrikadave 22",
          "Rruga e Kavajës 45",
          "Rruga e Elbasanit 210",
          "Rruga e Durrësit 12",
          "Rruga e Barrikadave 7",
          "Rruga Ibrahim Rugova 9",
        ]
      : [
          "1200 NW 23rd Ave",
          "340 SE Hawthorne Blvd",
          "1825 NE Alberta St",
          "900 SW 5th Ave",
          "2700 N Mississippi Ave",
          "1420 W Burnside St",
          "450 NE Couch St",
          "2100 W Burnside St",
        ];
  const street = streets[h % streets.length];
  const zipBase = city === "Seattle" ? 98100 : city === "Tirana" ? 1000 : 97200;
  const zip = zipBase + (h % (city === "Tirana" ? 80 : 45));
  const region = city === "Tirana" ? "AL" : state;
  const address = `${street}, ${city}${region ? `, ${region}` : ""} ${zip}`;

  return { lat, lng, address };
}

/**
 * @param {Array|undefined} raw
 * @param {string} rowId
 * @param {Array} servicesWithIds
 */
function normalizePublicStaffMembers(raw, rowId, servicesWithIds) {
  const validSvcIds = new Set(servicesWithIds.map((s) => s.id));
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((mem, idx) => {
      const mid =
        mem.id && String(mem.id).trim() ? String(mem.id).trim() : `${rowId}__stf__${idx}`;
      const photo = String(mem.photo || mem.photoUrl || "").trim();
      const serviceIds = (Array.isArray(mem.serviceIds) ? mem.serviceIds : [])
        .map((x) => String(x))
        .filter((x) => validSvcIds.has(x));
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const rawSched = mem.weeklySchedule;
      const weeklySchedule =
        rawSched && typeof rawSched === "object" && dayKeys.some((k) => Object.prototype.hasOwnProperty.call(rawSched, k))
          ? rawSched
          : undefined;
      const rating =
        typeof mem.rating === "number" && Number.isFinite(mem.rating) ? mem.rating : undefined;
      const reviewCount =
        typeof mem.reviewCount === "number" && mem.reviewCount >= 0 && Number.isFinite(mem.reviewCount)
          ? mem.reviewCount
          : undefined;
      return {
        id: mid,
        name: String(mem.name || "").trim() || "Professional",
        role: String(mem.role || "").trim(),
        description: String(mem.description || "").trim(),
        photo,
        serviceIds,
        bookable: mem.bookable !== false,
        ...(weeklySchedule ? { weeklySchedule } : {}),
        ...(rating != null ? { rating } : {}),
        ...(reviewCount != null ? { reviewCount } : {}),
      };
    })
    .filter((m) => m.name);
}

/** @param {string} id */
export function resolveBusiness(id) {
  if (!id) return null;
  const decoded = decodeURIComponent(id);
  const row = BY_ID[decoded];
  if (!row) return null;

  const ratingOverride =
    typeof row.rating === "number" && Number.isFinite(row.rating) ? row.rating : undefined;
  const reviewCountOverride =
    typeof row.reviewCount === "number" && Number.isFinite(row.reviewCount) && row.reviewCount >= 0
      ? Math.round(row.reviewCount)
      : undefined;

  const baseServices = row.services ?? defaultServices(row);
  const servicesWithIds = baseServices.map((s, idx) => {
    const sid = s.id && String(s.id).trim() ? String(s.id).trim() : `${row.id}__svc__${idx}`;
    return {
      ...s,
      id: sid,
      staff: s.staff ?? s.staffName,
    };
  });

  const staffMembers = normalizePublicStaffMembers(row.staff, row.id, servicesWithIds);
  const staffSectionEnabled = row.staffSectionEnabled === true;
  const staffBookingEnabled = row.staffBookingEnabled === true;
  const staffSectionTitle =
    (row.staffSectionTitle && String(row.staffSectionTitle).trim()) || "Staff";

  const services = servicesWithIds.map((s) => {
    const linked = staffMembers.filter((p) => (p.serviceIds || []).includes(s.id));
    const names = linked.map((p) => p.name).filter(Boolean);
    const displayStaff = names.length ? names.join(", ") : s.staff;
    return { ...s, linkedStaff: linked, staff: displayStaff, popular: s.popular === true };
  });

  const reviews = row.reviews ?? defaultReviews(row);
  const images = row.images?.length
    ? [...new Set(row.images.filter(Boolean))]
    : defaultGalleryImages(row);
  const coverImage =
    row.coverImage ?? images[0] ?? COVER_BY_CATEGORY[row.category] ?? DEFAULT_CATEGORY_FALLBACK_IMAGE;
  const weeklySchedule = row.weeklySchedule ?? DEFAULT_WEEKLY_SCHEDULE;
  let calendarBookings = row.calendarBookings ?? defaultDemoCalendarBookings(row.id);
  if (row.id === "barbershop-master" && !row.calendarBookings) {
    const todayISO = toISODate(new Date());
    calendarBookings = [
      { date: todayISO, startTime: "10:00", endTime: "10:45", status: "scheduled", staffId: "bm_alex" },
      { date: todayISO, startTime: "13:00", endTime: "13:30", status: "scheduled", staffId: "bm_jordan" },
    ];
  }
  const availableToday = row.availableToday ?? hashString(row.id) % 5 !== 0;
  const avgFromReviews = reviews.reduce((a, r) => a + r.rating, 0) / Math.max(1, reviews.length);
  const avg =
    ratingOverride != null
      ? Math.min(5, Math.max(0, ratingOverride))
      : avgFromReviews;
  const publicReviewCount = reviewCountOverride != null ? reviewCountOverride : reviews.length;

  const fallbackLoc = defaultLocation(row);
  const lat = row.lat ?? fallbackLoc.lat;
  const lng = row.lng ?? fallbackLoc.lng;
  const address = row.address ?? fallbackLoc.address;

  const { rating: _omitRating, reviewCount: _omitRc, ...rowRest } = row;

  return {
    ...rowRest,
    services,
    staff: staffMembers,
    staffSectionEnabled,
    staffBookingEnabled,
    staffSectionTitle,
    reviews,
    coverImage,
    images,
    weeklySchedule,
    calendarBookings,
    availableToday,
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: publicReviewCount,
    lat,
    lng,
    address,
  };
}

/**
 * Other listings for the business detail page: nearest first, then same category and city as tie-breakers.
 * @param {string} currentId
 * @param {Object} [opts]
 * @returns {Array}
 */
export function recommendedBusinesses(currentId, opts = {}) {
  const limit = opts.limit ?? 12;
  const decoded = decodeURIComponent(String(currentId || ""));
  const current = resolveBusiness(decoded);
  if (!current) return [];

  const scored = BUSINESS_ROWS.filter((r) => r.id !== current.id).map((r) => {
    const b = resolveBusiness(r.id);
    let distKm = Number.POSITIVE_INFINITY;
    if (
      typeof current.lat === "number" &&
      typeof current.lng === "number" &&
      typeof b.lat === "number" &&
      typeof b.lng === "number" &&
      Number.isFinite(current.lat) &&
      Number.isFinite(current.lng) &&
      Number.isFinite(b.lat) &&
      Number.isFinite(b.lng)
    ) {
      distKm = haversineKm(current.lat, current.lng, b.lat, b.lng);
    }
    const sameCategory = b.category === current.category ? 1 : 0;
    const sameCity = b.city === current.city ? 1 : 0;
    return { b, distKm, sameCategory, sameCity };
  });

  scored.sort((x, y) => {
    if (x.distKm !== y.distKm) return x.distKm - y.distKm;
    if (x.sameCategory !== y.sameCategory) return y.sameCategory - x.sameCategory;
    if (x.sameCity !== y.sameCity) return y.sameCity - x.sameCity;
    return x.b.name.localeCompare(y.b.name);
  });

  return scored.slice(0, limit).map(({ b }) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    averageRating: b.averageRating,
    images: Array.isArray(b.images) && b.images.length ? [...b.images] : [b.coverImage].filter(Boolean),
  }));
}
