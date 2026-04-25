/**
 * Shared booking availability: working hours + service duration → candidate slots;
 * scheduled bookings block by interval overlap (start_time / end_time or legacy time + duration).
 */

/** @param {number} n */
export function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

/** @param {Date} d */
export function toISODate(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

/** @param {Date} d */
export function dateToDayKey(d) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d.getDay()];
}

/** @param {string | undefined} s */
export function parseHMToMinutes(s) {
  const p = String(s || "09:00").split(":");
  const h = parseInt(p[0], 10);
  const m = parseInt(p[1] != null ? p[1] : "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 9 * 60;
  return h * 60 + m;
}

/** @param {number} mins */
export function minutesToHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return pad2(h) + ":" + pad2(m);
}

/**
 * Candidate start times: step = service duration; each slot fits inside [start, end].
 * @param {string} startStr
 * @param {string} endStr
 * @param {number} serviceDurationMin
 */
export function buildSlotsForDay(startStr, endStr, serviceDurationMin) {
  const slots = [];
  const a = parseHMToMinutes(startStr);
  const b = parseHMToMinutes(endStr);
  const step = serviceDurationMin > 0 ? serviceDurationMin : 30;
  for (let t = a; t + step <= b; t += step) {
    slots.push(minutesToHM(t));
  }
  return slots;
}

/** Default Mon–Sat 09:00–17:00, Sunday closed (matches business dashboard defaults). */
export function defaultWeeklySchedule() {
  const day = { enabled: true, start: "09:00", end: "17:00" };
  return {
    mon: { ...day },
    tue: { ...day },
    wed: { ...day },
    thu: { ...day },
    fri: { ...day },
    sat: { ...day },
    sun: { enabled: false, start: "09:00", end: "17:00" },
  };
}

/**
 * @typedef {{ start: number; end: number }} IntervalMinutes
 * @param {{ date?: string; startTime?: string; endTime?: string; time?: string; status?: string; serviceId?: string; service?: string }} booking
 * @param {(serviceId?: string, serviceName?: string) => number} resolveDurationMinutes
 * @returns {IntervalMinutes | null}
 */
export function getBookingIntervalMinutes(booking, resolveDurationMinutes) {
  if (!booking.date) return null;
  if (booking.startTime && booking.endTime) {
    const start = parseHMToMinutes(booking.startTime);
    const end = parseHMToMinutes(booking.endTime);
    if (end <= start) return { start, end: start + resolveDurationMinutes(booking.serviceId, booking.service) };
    return { start, end };
  }
  if (booking.time) {
    const start = parseHMToMinutes(booking.time);
    const dur = resolveDurationMinutes(booking.serviceId, booking.service);
    return { start, end: start + dur };
  }
  return null;
}

/**
 * @param {string} dateISO
 * @param {string} slotStartHM
 * @param {number} proposedDurationMin
 * @param {Array<{ date?: string; startTime?: string; endTime?: string; time?: string; status?: string; serviceId?: string; service?: string }>} bookings
 * @param {(serviceId?: string, serviceName?: string) => number} resolveDurationMinutes
 */
export function slotOverlapsScheduledBookings(dateISO, slotStartHM, proposedDurationMin, bookings, resolveDurationMinutes) {
  const ps = parseHMToMinutes(slotStartHM);
  const pe = ps + proposedDurationMin;
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    if (b.date !== dateISO) continue;
    if (b.status === "completed") continue;
    const iv = getBookingIntervalMinutes(b, resolveDurationMinutes);
    if (!iv) continue;
    if (ps < iv.end && iv.start < pe) return true;
  }
  return false;
}

/**
 * @param {string} dateISO
 * @param {string} slotStartHM
 * @param {number} proposedDurationMin
 * @param {Array<{ date?: string; startTime?: string; endTime?: string; time?: string; status?: string; serviceId?: string; service?: string }>} bookings
 * @param {(serviceId?: string, serviceName?: string) => number} resolveDurationMinutes
 */
export function filterAvailableSlots(dateISO, slotStartTimes, proposedDurationMin, bookings, resolveDurationMinutes) {
  return slotStartTimes.filter(
    (t) => !slotOverlapsScheduledBookings(dateISO, t, proposedDurationMin, bookings, resolveDurationMinutes),
  );
}
