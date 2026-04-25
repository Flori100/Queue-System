/**
 * Structured frontend demo: listings per canonical category (`BusinessRow.category`).
 * Category pages load only that slice via `getDemoListingsForCategoryPage`.
 *
 * Cover URLs use Unsplash Source with a per-business `sig` so each listing URL is unique.
 * Staff portraits use the same pattern with a distinct path segment.
 */

import { defaultWeeklySchedule } from "../bookingSlots.js";
import { sliceDemoGallery, demoStaffPortraitUrl } from "./demoMediaPools.js";

const STRICT_CATEGORY_IMAGE_SETS = {
  Barbershop: [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589985494639-69e60c82cab2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605497787865-e6d4762b386f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?auto=format&fit=crop&w=1200&q=80",
  ],
  Nails: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1610992015836-7c249d75782d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1630843599725-32ead7671867?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1652990337463-b79f5759e0b8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587729927069-ef3b7a5ab9b4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
  ],
  Fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c62306601b7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
  ],
};

const CATEGORY_IMAGE_FALLBACKS = {
  Dermatology: [
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=1200&q=80",
  ],
  Physiotherapy: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?auto=format&fit=crop&w=1200&q=80",
  ],
  TattooStudios: [
    "https://images.unsplash.com/photo-1611241893603-3c359704e0ee?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521483350965-8a7f10f7a98f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542727365-19732a80dcfd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1619603364904-c0498317e145?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590246814883-57ce7a4ec6e5?auto=format&fit=crop&w=1200&q=80",
  ],
  CarDetailing: [
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1606016159991-6c43d4f8f28c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
  ],
  PhotographySessions: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=1200&q=80",
  ],
};

const DEFAULT_CATEGORY_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?auto=format&fit=crop&w=1200&q=80",
];

/** @param {string} s */
function h32(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** @param {number} n */
function clampListingRating(n) {
  return Math.round(Math.min(5, Math.max(4.2, n)) * 10) / 10;
}

/**
 * Seven curated Unsplash URLs per listing (category-themed, disjoint global pool in demoMediaPools.json).
 * @param {string} category canonical e.g. `Barbershop`
 * @param {string} businessId stable row id (unused; kept for callers)
 * @param {number} [ordinalInCategory] 0-based index within the category demo bundle
 * @returns {string[]}
 */
export function demoListingImageUrls(category, businessId, ordinalInCategory = 0) {
  const forcedSet = STRICT_CATEGORY_IMAGE_SETS[String(category || "").trim()];
  if (forcedSet && forcedSet.length) {
    return forcedSet;
  }
  void businessId;
  const list = sliceDemoGallery(category, ordinalInCategory);
  if (list.length) return list;
  const fallback = CATEGORY_IMAGE_FALLBACKS[String(category || "").trim()] || [];
  if (fallback.length) return fallback;
  return DEFAULT_CATEGORY_FALLBACK_IMAGES;
}

const TIRANA_LOCATIONS = [
  "Tirana • Blloku",
  "Tirana • Ish-Blloku",
  "Tirana • Pazari i Ri",
  "Tirana • 21 Dhjetori",
  "Tirana • Don Bosko",
  "Tirana • Laprakë",
  "Tirana • Kinostudio",
  "Tirana • Selitë",
  "Tirana • Kombinati",
  "Tirana • Astir",
  "Tirana • Fresku",
  "Tirana • Sauk",
];

/** @type {Record<string, ReadonlyArray<{ name: string; duration: string; price: string }>>} */
const SERVICE_TEMPLATES = {
  Barbershop: [
    { name: "Signature cut & finish", duration: "45 min", price: "1,900 Lek", popular: true },
    { name: "Fade & beard trim", duration: "50 min", price: "2,200 Lek" },
    { name: "Hot towel straight-razor shave", duration: "40 min", price: "1,600 Lek" },
    { name: "Clipper design & lineup", duration: "40 min", price: "1,750 Lek" },
    { name: "Kids’ school cut", duration: "35 min", price: "1,200 Lek" },
    { name: "Grey blending treatment", duration: "55 min", price: "3,400 Lek" },
  ],
  HairSalon: [
    { name: "Cut & blowdry", duration: "60 min", price: "2,800 Lek" },
    { name: "Partial highlights", duration: "120 min", price: "6,800 Lek" },
    { name: "Keratin smoothing", duration: "90 min", price: "9,200 Lek" },
    { name: "Root colour refresh", duration: "75 min", price: "4,400 Lek" },
    { name: "Gloss & tone", duration: "45 min", price: "2,300 Lek" },
    { name: "Bridal trial styling", duration: "90 min", price: "5,600 Lek" },
  ],
  Nails: [
    { name: "Gel manicure", duration: "50 min", price: "1,900 Lek" },
    { name: "Spa pedicure", duration: "65 min", price: "2,500 Lek" },
    { name: "Builder gel overlay", duration: "75 min", price: "3,300 Lek" },
    { name: "Nail art session", duration: "55 min", price: "2,100 Lek" },
    { name: "Paraffin add-on", duration: "20 min", price: "700 Lek" },
    { name: "Dip powder full set", duration: "70 min", price: "2,950 Lek" },
  ],
  Spa: [
    { name: "Swedish relaxation massage", duration: "60 min", price: "3,900 Lek" },
    { name: "Deep tissue therapy", duration: "75 min", price: "4,500 Lek" },
    { name: "Aromatherapy facial", duration: "50 min", price: "3,300 Lek" },
    { name: "Hot stone add-on", duration: "30 min", price: "1,100 Lek" },
    { name: "Couples suite ritual", duration: "90 min", price: "7,900 Lek" },
    { name: "Thai mat massage", duration: "70 min", price: "4,100 Lek" },
  ],
  Fitness: [
    { name: "Drop-in HIIT class", duration: "50 min", price: "900 Lek" },
    { name: "Personal training session", duration: "60 min", price: "3,600 Lek" },
    { name: "Heated vinyasa flow", duration: "75 min", price: "950 Lek" },
    { name: "Intro movement screen", duration: "30 min", price: "Free" },
    { name: "Small-group strength", duration: "55 min", price: "1,250 Lek" },
    { name: "Open gym day pass", duration: "Full day", price: "700 Lek" },
  ],
  Dentist: [
    { name: "Exam & hygiene", duration: "60 min", price: "4,600 Lek" },
    { name: "Professional whitening", duration: "75 min", price: "18,500 Lek" },
    { name: "Composite restoration", duration: "45 min", price: "6,800 Lek" },
    { name: "Invisalign® consult", duration: "40 min", price: "Free" },
    { name: "Emergency pain visit", duration: "30 min", price: "5,200 Lek" },
    { name: "Pediatric check-up", duration: "45 min", price: "3,900 Lek" },
  ],
  Dermatology: [
    { name: "Full-body skin check", duration: "30 min", price: "5,600 Lek" },
    { name: "Acne treatment plan visit", duration: "45 min", price: "7,400 Lek" },
    { name: "Chemical peel session", duration: "40 min", price: "6,900 Lek" },
    { name: "Laser resurfacing consult", duration: "30 min", price: "Free" },
    { name: "Patch testing work-up", duration: "60 min", price: "9,000 Lek" },
    { name: "Cosmetic injectables consult", duration: "45 min", price: "4,200 Lek" },
  ],
  Physiotherapy: [
    { name: "Initial physiotherapy assessment", duration: "50 min", price: "4,200 Lek" },
    { name: "Sports injury rehab", duration: "60 min", price: "4,900 Lek" },
    { name: "Manual therapy session", duration: "45 min", price: "3,700 Lek" },
    { name: "Post-op recovery plan", duration: "60 min", price: "5,200 Lek" },
    { name: "Dry needling add-on", duration: "30 min", price: "2,400 Lek" },
    { name: "Mobility screening", duration: "35 min", price: "2,900 Lek" },
  ],
  TattooStudios: [
    { name: "Design consultation", duration: "30 min", price: "Free" },
    { name: "Fine-line tattoo session", duration: "90 min", price: "9,500 Lek" },
    { name: "Blackwork custom piece", duration: "120 min", price: "14,000 Lek" },
    { name: "Color tattoo session", duration: "120 min", price: "15,500 Lek" },
    { name: "Touch-up appointment", duration: "45 min", price: "3,000 Lek" },
    { name: "Flash tattoo slot", duration: "60 min", price: "6,200 Lek" },
  ],
  CarDetailing: [
    { name: "Express interior detail", duration: "60 min", price: "3,900 Lek" },
    { name: "Exterior wash + wax", duration: "75 min", price: "4,800 Lek" },
    { name: "Full detailing package", duration: "150 min", price: "11,500 Lek" },
    { name: "Engine bay clean", duration: "40 min", price: "2,900 Lek" },
    { name: "Ceramic coating refresh", duration: "120 min", price: "10,500 Lek" },
    { name: "Headlight restoration", duration: "45 min", price: "3,200 Lek" },
  ],
  PhotographySessions: [
    { name: "Portrait session", duration: "60 min", price: "7,900 Lek" },
    { name: "Couples photo shoot", duration: "75 min", price: "9,600 Lek" },
    { name: "Family mini session", duration: "45 min", price: "6,400 Lek" },
    { name: "Branding headshots", duration: "60 min", price: "8,800 Lek" },
    { name: "Event coverage consult", duration: "30 min", price: "Free" },
    { name: "Outdoor golden-hour shoot", duration: "90 min", price: "10,400 Lek" },
  ],
};

/** @type {Record<string, ReadonlyArray<readonly [string, string, string, number, number]>>} */
const STAFF_ROTATIONS = {
  Barbershop: [
    ["Ardit Krasniqi", "Senior barber", "Fades, texture, and beard sculpting.", 4.9, 168],
    ["Erion Hoxha", "Barber", "Classic cuts and razor line-ups.", 4.8, 124],
    ["Bledi Meta", "Barber", "Clipper design and first-time consults.", 4.7, 91],
    ["Endi Shehu", "Junior barber", "Quick trims and student cuts.", 4.6, 63],
  ],
  HairSalon: [
    ["Elona Prifti", "Lead stylist", "Balayage, lived-in colour, extensions.", 4.9, 201],
    ["Blerta Dervishi", "Colourist", "Corrective colour and glossing.", 4.8, 156],
    ["Dea Kola", "Stylist", "Curly cuts and hydration treatments.", 4.7, 118],
    ["Sara Gjika", "Junior stylist", "Blowouts and event styling.", 4.6, 74],
  ],
  Nails: [
    ["Erinda Çela", "Lead nail artist", "Gel, builder, and chrome finishes.", 4.9, 142],
    ["Megi Brahimi", "Nail technician", "Natural nail care and repairs.", 4.8, 103],
    ["Klea Berisha", "Nail artist", "Hand-painted nail art.", 4.7, 88],
    ["Jona Sinani", "Technician", "Express mani-pedi bar.", 4.5, 52],
  ],
  Spa: [
    ["Ornela Marku", "Senior therapist", "Deep tissue and sports recovery.", 4.9, 176],
    ["Alma Basha", "Massage therapist", "Swedish and prenatal sessions.", 4.8, 129],
    ["Besa Koci", "Esthetician", "Facials, LED, and peel prep.", 4.7, 97],
    ["Greta Leka", "Spa therapist", "Hot stone and aromatherapy.", 4.6, 71],
  ],
  Fitness: [
    ["Flori Deda", "Head coach", "Strength blocks and lifting technique.", 4.9, 188],
    ["Denis Rama", "Personal trainer", "Fat loss and conditioning.", 4.8, 141],
    ["Arben Kuka", "Class coach", "HIIT and metabolic circuits.", 4.7, 106],
    ["Kledi Hysa", "Yoga lead", "Mobility and heated flow.", 4.6, 82],
  ],
  Dentist: [
    ["Dr. Enkeleda Hoxha", "Dentist", "Restorative and family dentistry.", 4.9, 214],
    ["Dr. Blendi Krasniqi", "Orthodontist", "Aligners and adolescent care.", 4.8, 167],
    ["Dr. Megi Shehu", "Dentist", "Cosmetic bonding and veneers.", 4.8, 139],
    ["Hygienist Team", "Dental hygiene", "Preventive cleanings and perio care.", 4.7, 256],
  ],
  Dermatology: [
    ["Dr. Arta Kelmendi", "Dermatologist", "Medical dermatology & skin cancer.", 4.9, 223],
    ["Dr. Besnik Berisha", "Dermatologist", "Acne, rosacea, and eczema.", 4.8, 178],
    ["Edona Kuka, PA", "Physician associate", "Procedures and follow-ups.", 4.8, 131],
    ["Dr. Jonida Prifti", "Cosmetic derm", "Lasers and injectables.", 4.7, 119],
  ],
  Physiotherapy: [
    ["Erald Shehu", "Lead physiotherapist", "Sports rehab and movement recovery.", 4.9, 187],
    ["Alketa Kola", "Physiotherapist", "Post-op care and pain management plans.", 4.8, 149],
    ["Gerti Meta", "Manual therapist", "Neck, back, and shoulder treatment.", 4.7, 121],
    ["Sindi Dervishi", "Rehab specialist", "Mobility and strengthening protocols.", 4.7, 106],
  ],
  TattooStudios: [
    ["Arjan Hasa", "Tattoo artist", "Fine-line and blackwork custom pieces.", 4.9, 164],
    ["Klea Leka", "Tattoo artist", "Color realism and floral styles.", 4.8, 133],
    ["Reni Basha", "Resident artist", "Minimalist flash and lettering.", 4.7, 99],
    ["Studio Team", "Aftercare support", "Prep, aftercare, and touch-up guidance.", 4.7, 141],
  ],
  CarDetailing: [
    ["Ilir Gjoni", "Master detailer", "Paint correction and ceramic protection.", 4.9, 173],
    ["Edison Hoxha", "Detail technician", "Interior deep cleaning and odor treatment.", 4.8, 138],
    ["Arta Pema", "Coating specialist", "Hydrophobic coatings and finish protection.", 4.7, 107],
    ["Rapid Team", "Detail crew", "Quick turnaround detailing packages.", 4.7, 125],
  ],
  PhotographySessions: [
    ["Nora Lika", "Lead photographer", "Portraits, editorial, and lifestyle shoots.", 4.9, 192],
    ["Erjon Vata", "Photographer", "Event and couples sessions.", 4.8, 154],
    ["Megi Sina", "Photographer", "Family sessions and natural light work.", 4.8, 132],
    ["Studio Ops", "Coordinator", "Scheduling, location prep, and delivery.", 4.7, 166],
  ],
};

/**
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.name
 * @param {string} p.category
 * @param {number} p.locationIndex
 * @param {number} p.rating
 * @param {number} p.reviewCount
 * @param {boolean} p.withProfessionals
 * @param {number} p.listingOrdinalInCategory
 * @param {number} p.listingGlobalIndex
 */
function buildListing(p) {
  const ord = Math.max(0, Number(p.listingOrdinalInCategory) || 0);
  const galleryUrls = demoListingImageUrls(p.category, p.id, ord);
  const cover =
    galleryUrls.length > 0 ? galleryUrls[ord % galleryUrls.length] : "";
  const locationLabel = TIRANA_LOCATIONS[p.locationIndex % TIRANA_LOCATIONS.length];
  const templates = SERVICE_TEMPLATES[p.category];
  const h = h32(p.id);
  const n = templates.length;
  const idxs = [0, 1, 2].map((k) => (h + k * 2) % n);
  const picked = [];
  const seenNames = new Set();
  for (let k = 0; k < idxs.length; k++) {
    let step = 0;
    let j = idxs[k];
    while (step < n && seenNames.has(templates[j].name)) {
      j = (j + 1) % n;
      step++;
    }
    seenNames.add(templates[j].name);
    picked.push(templates[j]);
  }

  /** @type {Array<{ id: string; name: string; duration: string; price: string; staffName: string }>} */
  const services = picked.map((s, idx) => ({
    id: `${p.id}__svc__${idx}`,
    name: s.name,
    duration: s.duration,
    price: s.price,
    staffName: "Team",
    ...(s.popular === true ? { popular: true } : {}),
  }));

  /** @type {Array<Record<string, unknown>>} */
  let staff = [];
  if (p.withProfessionals) {
    const pool = STAFF_ROTATIONS[p.category];
    const count = 3 + (h % 2);
    const start = h % pool.length;
    for (let i = 0; i < count; i++) {
      const [name, role, bio, rating, reviewCount] = pool[(start + i) % pool.length];
      staff.push({
        id: `${p.id}__stf__${i}`,
        name,
        role,
        description: bio,
        photo: demoStaffPortraitUrl(p.listingGlobalIndex * 4 + i),
        serviceIds: [`${p.id}__svc__${i % 3}`, `${p.id}__svc__${(i + 1) % 3}`],
        bookable: true,
        rating: clampListingRating(rating),
        reviewCount,
      });
    }
    for (let s = 0; s < services.length; s++) {
      services[s].staffName = staff[s % staff.length].name;
    }
  }

  const base = {
    id: p.id,
    name: p.name,
    description: locationLabel,
    location: locationLabel,
    category: p.category,
    city: "Tirana",
    rating: clampListingRating(p.rating),
    reviewCount: p.reviewCount,
    coverImage: cover,
    images: galleryUrls,
    services,
  };

  if (!p.withProfessionals) {
    return {
      ...base,
      staffSectionEnabled: false,
      staffBookingEnabled: false,
    };
  }

  const title =
    p.category === "Fitness"
      ? "Trainers & coaches"
      : p.category === "Dentist"
        ? "Clinicians"
        : p.category === "Dermatology"
          ? "Specialists"
          : p.category === "CarDetailing"
            ? "Detailing experts"
            : p.category === "PhotographySessions"
              ? "Photographers"
                : "Professionals";

  const row = {
    ...base,
    staffSectionEnabled: true,
    staffBookingEnabled: true,
    staffSectionTitle: title,
    staff,
  };

  if (p.id === "barbershop-master") {
    const mon = defaultWeeklySchedule();
    const staffPatched = staff.map((m, idx) => {
      if (idx !== 1) return m;
      return {
        ...m,
        weeklySchedule: { ...mon, mon: { enabled: true, start: "10:30", end: "15:00" } },
      };
    });
    return { ...row, staff: staffPatched };
  }

  return row;
}

/** Increments once per demo listing row across all categories (Barbershop → … → Dermatology). */
let DEMO_LISTING_GLOBAL_SEQ = 0;

/**
 * @param {string} category
 * @param {ReadonlyArray<readonly [string, string, number, number, number]>} specs
 * @param {boolean} withProfessionals
 */
function buildCategory(category, specs, withProfessionals) {
  return specs.map(([id, name, locIdx, rating, reviewCount], ord) => {
    const listingGlobalIndex = DEMO_LISTING_GLOBAL_SEQ++;
    return buildListing({
      id,
      name,
      category,
      locationIndex: locIdx,
      rating,
      reviewCount,
      withProfessionals,
      listingOrdinalInCategory: ord,
      listingGlobalIndex,
    });
  });
}

/** Each tuple: id, display name, location index, rating, reviewCount */
const BARBER_SPECS = /** @type {const} */ ([
  ["barbershop-master", "Artizan Grooming House", 0, 4.9, 241],
  ["meridian-cuts", "Meridian Fades Tirana", 1, 4.8, 196],
  ["steel-and-comb", "Steel & Comb Social Club", 2, 4.7, 154],
  ["north-end-grooming", "North Quarter Barbers", 3, 4.85, 178],
  ["blade-room-pdx", "Blade Room 21", 4, 4.75, 143],
  ["fresh-fade-co", "Fresh Fade Atelier", 5, 4.65, 128],
  ["copper-line-barbers", "Copper Line Barbers", 6, 4.55, 112],
  ["beacon-fade-studio", "Beacon Fade Studio", 7, 4.9, 205],
  ["skanderbeg-lineups", "Skanderbeg Line-ups", 8, 4.72, 134],
  ["don-bosko-grooming", "Don Bosko Grooming Co.", 9, 4.68, 119],
]);

const SALON_SPECS = /** @type {const} */ ([
  ["velvet-strand-salon", "Velvet Strand Salon", 0, 4.88, 267],
  ["lumen-hair-atelier", "Lumen Hair Atelier", 1, 4.82, 221],
  ["rosewater-blowdry-bar", "Rosewater Blowdry Bar", 2, 4.76, 189],
  ["cascade-color-lab", "Cascade Colour Lab", 3, 4.7, 156],
  ["halo-texture-studio", "Halo Texture Studio", 4, 4.92, 243],
  ["northwest-roots-collective", "Northwest Roots Collective", 5, 4.64, 131],
  ["emberline-hair-co", "Emberline Hair Co.", 6, 4.79, 172],
  ["studio-lift-seattle", "Studio Lift Tirana", 7, 4.73, 148],
  ["atelier-flutra", "Atelier Flutra", 8, 4.86, 198],
  ["selite-blonde-lab", "Selitë Blonde Lab", 9, 4.69, 124],
]);

const NAILS_SPECS = /** @type {const} */ ([
  ["luna-nails-lounge", "Luna Nails Lounge", 0, 4.84, 209],
  ["polished-pearl-studio", "Polished Pearl Studio", 1, 4.78, 176],
  ["sakura-nail-bar", "Sakura Nail Bar Tirana", 2, 4.71, 142],
  ["rosewater-mani-studio", "Rosewater Mani Studio", 3, 4.9, 231],
  ["mint-tips-collective", "Mint Tips Collective", 4, 4.66, 118],
  ["velvet-cuticle-bar", "Velvet Cuticle Bar", 5, 4.8, 165],
  ["dazzle-digits-pdx", "Dazzle Digits Tirana", 6, 4.74, 151],
  ["honeycomb-mani-co", "Honeycomb Mani Co.", 7, 4.62, 107],
  ["astir-gel-studio", "Astir Gel Studio", 8, 4.87, 193],
  ["sauk-nail-atelier", "Sauk Nail Atelier", 9, 4.68, 129],
]);

const SPA_SPECS = /** @type {const} */ ([
  ["spa-crown", "Spa Crown Tirana", 0, 4.91, 254],
  ["glow-studio-pdx", "Glow Studio Blloku", 1, 4.83, 198],
  ["relax-spa", "Relax Spa & Sauna", 2, 4.77, 171],
  ["deep-tissue-massage-studio", "Deep Tissue Massage Studio", 3, 4.72, 149],
  ["serenity-massage-parlor", "Serenity Massage Parlour", 4, 4.65, 126],
  ["urban-escape-spa", "Urban Escape Spa", 5, 4.88, 217],
  ["golden-lotus-thai-massage", "Golden Lotus Thai Massage", 6, 4.79, 183],
  ["harmony-day-spa", "Harmony Day Spa", 7, 4.7, 158],
  ["fresku-thermal-retreat", "Fresku Thermal Retreat", 8, 4.86, 192],
  ["sauk-wellness-loft", "Sauk Wellness Loft", 9, 4.67, 133],
]);

const FITNESS_SPECS = /** @type {const} */ ([
  ["the-iron-gym", "The Iron Gym Tirana", 0, 4.89, 312],
  ["iron-district-gym", "Iron District Gym", 1, 4.81, 228],
  ["steel-circuit-training", "Steel Circuit Training", 2, 4.76, 189],
  ["row-house-rose-city", "Row House Liqeni", 3, 4.7, 156],
  ["train-yard-crossfit", "Train Yard CrossFit", 4, 4.93, 278],
  ["pulse-yoga-lab", "Pulse Yoga Lab", 5, 4.74, 164],
  ["burnside-boulders", "Blloku Boulders Climb", 6, 4.68, 141],
  ["velocity-pt-studio", "Velocity PT Studio", 7, 4.84, 201],
  ["tirana-barbell-club", "Tirana Barbell Club", 8, 4.72, 152],
  ["fresku-athletic-house", "Fresku Athletic House", 9, 4.66, 128],
]);

const DENTIST_SPECS = /** @type {const} */ ([
  ["bridgeway-dental-studio", "Bridgeway Dental Studio", 0, 4.88, 268],
  ["rose-city-smile-co", "Tirana Smile Co.", 1, 4.82, 231],
  ["willamette-family-dentistry", "Willamette Family Dentistry Tirana", 2, 4.76, 194],
  ["northwest-dental-arts", "Northwest Dental Arts", 3, 4.71, 172],
  ["cascade-orthodontics-pdx", "Cascade Orthodontics Tirana", 4, 4.9, 289],
  ["alder-dental-collective", "Alder Dental Collective", 5, 4.74, 181],
  ["pacific-north-dental", "Pacific North Dental", 6, 4.68, 156],
  ["soundview-dental-seattle", "Soundview Dental Tirana", 7, 4.79, 203],
  ["gentle-smile-kinostudio", "Gentle Smile Kinostudio", 8, 4.84, 219],
  ["blloku-digital-dentistry", "Blloku Digital Dentistry", 9, 4.73, 165],
]);

const DERM_SPECS = /** @type {const} */ ([
  ["clearline-derm-pdx", "Clearline Dermatology Tirana", 0, 4.9, 242],
  ["northwest-skin-institute", "Northwest Skin Institute", 1, 4.84, 206],
  ["riverfront-derm-studio", "Riverfront Derm Studio", 2, 4.78, 178],
  ["lumen-aesthetic-derm", "Lumen Aesthetic Derm", 3, 4.72, 154],
  ["alberta-skin-clinic", "Alberta Skin Clinic Tirana", 4, 4.66, 131],
  ["hazel-derm-collective", "Hazel Derm Collective", 5, 4.87, 224],
  ["summit-skin-lab", "Summit Skin Lab", 6, 4.8, 191],
  ["cascade-derm-seattle", "Cascade Dermatology Tirana", 7, 4.75, 169],
  ["skin-first-astir", "Skin First Astir", 8, 4.83, 201],
  ["clarity-derm-sauk", "Clarity Derm Sauk", 9, 4.7, 147],
]);

const PHYSIO_SPECS = /** @type {const} */ ([
  ["motionlab-physio", "MotionLab Physiotherapy", 0, 4.9, 212],
  ["recover-point-clinic", "Recover Point Clinic", 1, 4.84, 176],
  ["core-balance-therapy", "Core Balance Therapy", 2, 4.78, 149],
  ["active-relief-physio", "Active Relief Physio", 3, 4.72, 133],
  ["stridecare-physio-center", "StrideCare Physiotherapy Center", 4, 4.67, 118],
]);

const TATTOO_SPECS = /** @type {const} */ ([
  ["ink-harbor-studio", "Ink Harbor Studio", 5, 4.92, 205],
  ["linecraft-tattoo", "Linecraft Tattoo Atelier", 6, 4.86, 171],
  ["blackframe-tattoo", "Blackframe Tattoo", 7, 4.79, 148],
  ["atelier-ink-blloku", "Atelier Ink Blloku", 8, 4.74, 129],
  ["northlane-tattoo-room", "Northlane Tattoo Room", 9, 4.69, 112],
]);

const DETAILING_SPECS = /** @type {const} */ ([
  ["mirror-finish-detailing", "Mirror Finish Detailing", 0, 4.89, 187],
  ["urban-shine-auto-spa", "Urban Shine Auto Spa", 2, 4.83, 163],
  ["prime-coat-detail-lab", "Prime Coat Detail Lab", 4, 4.77, 141],
  ["gloss-garage-detailing", "Gloss Garage Detailing", 6, 4.71, 122],
  ["astir-auto-detail-hub", "Astir Auto Detail Hub", 8, 4.66, 108],
]);

const PHOTO_SPECS = /** @type {const} */ ([
  ["lumen-portrait-studio", "Lumen Portrait Studio", 1, 4.91, 219],
  ["golden-hour-collective", "Golden Hour Collective", 3, 4.85, 184],
  ["frame-story-photo", "Frame Story Photography", 5, 4.8, 159],
  ["northlight-photo-room", "Northlight Photo Room", 7, 4.74, 136],
  ["fresku-photo-house", "Fresku Photo House", 9, 4.7, 121],
]);

/** @type {Record<string, ReadonlyArray<Record<string, unknown>>>} */
export const DEMO_LISTINGS_BY_CATEGORY = {
  Barbershop: buildCategory("Barbershop", BARBER_SPECS, true),
  HairSalon: buildCategory("HairSalon", SALON_SPECS, true),
  Nails: buildCategory("Nails", NAILS_SPECS, true),
  Spa: buildCategory("Spa", SPA_SPECS, true),
  Fitness: buildCategory("Fitness", FITNESS_SPECS, true),
  Dentist: buildCategory("Dentist", DENTIST_SPECS, true),
  Dermatology: buildCategory("Dermatology", DERM_SPECS, true),
  Physiotherapy: buildCategory("Physiotherapy", PHYSIO_SPECS, true),
  TattooStudios: buildCategory("TattooStudios", TATTOO_SPECS, true),
  CarDetailing: buildCategory("CarDetailing", DETAILING_SPECS, true),
  PhotographySessions: buildCategory("PhotographySessions", PHOTO_SPECS, true),
};

const CANONICAL_ORDER = [
  "Barbershop",
  "HairSalon",
  "Nails",
  "Spa",
  "Fitness",
  "Dentist",
  "Dermatology",
  "Physiotherapy",
  "TattooStudios",
  "CarDetailing",
  "PhotographySessions",
];

/**
 * Category page: returns only that category’s demo rows (no mixing).
 * @param {string} canonicalCategory e.g. `Barbershop`
 */
export function getDemoListingsForCategoryPage(canonicalCategory) {
  const key = String(canonicalCategory || "").trim();
  const rows = DEMO_LISTINGS_BY_CATEGORY[key];
  return rows ? [...rows] : [];
}

/** Flat union for the global registry (`BUSINESS_ROWS`) and business detail resolution. */
export function flattenDemoListingRows() {
  /** @type {Record<string, unknown>[]} */
  const out = [];
  for (let i = 0; i < CANONICAL_ORDER.length; i++) {
    const k = CANONICAL_ORDER[i];
    const chunk = DEMO_LISTINGS_BY_CATEGORY[k];
    if (chunk) {
      for (let j = 0; j < chunk.length; j++) out.push(chunk[j]);
    }
  }
  return out;
}
