const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./placeCardNav-BhdLa5bI.js","./businessLikesStore-aK3WwMNe.js"])))=>i.map(i=>d[i]);
import{_ as $}from"./preload-helper-lMf9uHy8.js";import{b as ee,e as te,B as ne,g as ae,r as R,h as ie}from"./businessLikesStore-aK3WwMNe.js";import{i as K,a as J,g as z}from"./currentLocation-DtWO5s41.js";import{L as I}from"./leaflet-src-CcPsAtP1.js";/* empty css                */const re=[41.3275,19.8187],oe=13;let M=null;function ce(e,s){if(!s.length){e.setView(re,oe);return}if(s.length===1){e.setView([s[0].lat,s[0].lng],14);return}const n=I.latLngBounds(s.map(t=>[t.lat,t.lng]));e.fitBounds(n,{padding:[56,56],maxZoom:16})}function se(){return I.divIcon({className:"qlist-map-marker",html:'<div class="qlist-map-pin-inner" aria-hidden="true"></div>',iconSize:[22,28],iconAnchor:[11,28],popupAnchor:[0,-26]})}function D(e){if(!M)return;const s=M.highlightedId;if(s!==e){if(M.highlightedId=e,s){const n=M.markersById.get(s),t=n&&typeof n.getElement=="function"?n.getElement():null;t&&t.classList.remove("qlist-map-marker--highlight");const o=M.gridEl.querySelector('.place-card[data-business-id="'+s+'"]');o&&o instanceof HTMLElement&&o.classList.remove("place-card--map-hover")}if(e){const n=M.markersById.get(e),t=n&&typeof n.getElement=="function"?n.getElement():null;t&&t.classList.add("qlist-map-marker--highlight");const o=M.gridEl.querySelector('.place-card[data-business-id="'+e+'"]');o&&o instanceof HTMLElement&&o.classList.add("place-card--map-hover")}}}function U(e,s,n){const t=n.get(e);if(!t)return;const o=t.getLatLng(),u=s.getZoom();s.flyTo(o,typeof u=="number"&&u>=15?u:15,{duration:.35})}function X(){if(M){try{M.map.remove()}catch{}M.resizeObserver.disconnect(),M.gridAbort.abort(),M=null}}function W(){X()}function le({containerEl:e,captionEl:s,points:n,gridEl:t,canonical:o}){if(!e)return;X();const u=I.map(e,{zoomControl:!0,attributionControl:!0,scrollWheelZoom:!0});I.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(u);const p=new Map;if(n.forEach(d=>{if(typeof d.lat!="number"||typeof d.lng!="number"||!Number.isFinite(d.lat)||!Number.isFinite(d.lng))return;const x=I.marker([d.lat,d.lng],{icon:se()}).addTo(u);p.set(d.id,x),x.on("click",function(){window.location.href=ee(d.id)}),x.on("mouseover",function(){D(d.id)}),x.on("mouseout",function(){D(null)})}),ce(u,n),s){const d=n.length;d?s.textContent=(d===1?"1 place — ":d+" places — ")+o+" · OpenStreetMap":s.textContent="No locations with coordinates — "+o+" · OpenStreetMap"}const C=new AbortController,h=C.signal;function f(d){const x=d.target;if(!(x instanceof Element))return;const L=x.closest(".place-card");if(!L||!t.contains(L))return;const S=L.getAttribute("data-business-id");S&&(U(S,u,p),D(S))}function w(){D(null)}t.addEventListener("pointerdown",f,{capture:!0,signal:h}),t.querySelectorAll(".place-card").forEach(function(d){d.addEventListener("mouseenter",function(x){const L=x.currentTarget;if(!(L instanceof HTMLElement))return;const S=L.getAttribute("data-business-id");S&&D(S)},{signal:h}),d.addEventListener("mouseleave",w,{signal:h}),d.addEventListener("focusin",function(x){const L=x.currentTarget;if(!(L instanceof HTMLElement))return;const S=L.getAttribute("data-business-id");S&&(U(S,u,p),D(S))},{signal:h}),d.addEventListener("focusout",w,{signal:h})});const _=new ResizeObserver(function(){u.invalidateSize()});_.observe(e),M={map:u,markersById:p,gridEl:t,resizeObserver:_,highlightedId:null,gridAbort:C},window.setTimeout(function(){u.invalidateSize()},200)}function de(){const e=[{btn:"date-picker-btn",labelFull:"date-picker-label-full",labelCompact:"date-picker-label-compact",dropdown:"date-picker-dropdown",grid:"date-picker-grid",month:"date-picker-month",year:"date-picker-year",prev:"date-picker-prev",next:"date-picker-next"}],s=[];for(let n=0;n<e.length;n++){const t=e[n],o=document.getElementById(t.btn),u=document.getElementById(t.labelFull),p=document.getElementById(t.labelCompact),C=document.getElementById(t.dropdown),h=document.getElementById(t.grid),f=document.getElementById(t.month),w=document.getElementById(t.year),v=document.getElementById(t.prev),_=document.getElementById(t.next);if(!o||!u||!C||!h||!f||!w||!v||!_)continue;const d=o.closest(".date-picker-wrap");d&&s.push({wrap:d,btn:o,labelFull:u,labelCompact:p,dropdown:C,grid:h,monthSelect:f,yearSelect:w,prevBtn:v,nextBtn:_})}return s}function q(){if(typeof document>"u"||!document.body||document.body.dataset.qlistDatePickerInit==="1")return;const e=de();if(!e.length)return;document.body.dataset.qlistDatePickerInit="1";const s=["January","February","March","April","May","June","July","August","September","October","November","December"];let n=new Date;n.setDate(1);let t=null,o=!1;const u=new Date().getFullYear(),p=u-120,C=u+25;function h(i,r){return!!i&&!!r&&i.getFullYear()===r.getFullYear()&&i.getMonth()===r.getMonth()&&i.getDate()===r.getDate()}function f(){for(let i=0;i<e.length;i++){const r=e[i];if(t){const k=t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),E=t.toLocaleDateString("en-US",{month:"short",day:"numeric"});r.labelFull.textContent=k,r.labelCompact&&(r.labelCompact.textContent=E),r.btn.setAttribute("aria-label","Choose appointment date. Selected "+t.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})+".")}else r.labelFull.textContent="Any time",r.labelCompact&&(r.labelCompact.textContent="Time"),r.btn.setAttribute("aria-label","Choose appointment date. Any time.")}}function w(){const i=n.getFullYear(),r=n.getMonth();for(let k=0;k<e.length;k++){const E=e[k].monthSelect,A=e[k].yearSelect;E.innerHTML="";for(let a=0;a<12;a++){const c=document.createElement("option");c.value=String(a),c.textContent=s[a],a===r&&(c.selected=!0),E.appendChild(c)}A.innerHTML="";for(let a=p;a<=C;a++){const c=document.createElement("option");c.value=String(a),c.textContent=String(a),a===i&&(c.selected=!0),A.appendChild(c)}}}function v(i){i.innerHTML="";const r=n.getFullYear(),k=n.getMonth(),E=new Date(r,k,1).getDay(),A=new Date(r,k+1,0).getDate(),a=new Date,c=E;for(let m=0;m<c;m++){const l=document.createElement("span");l.className="date-picker__day date-picker__day--pad",l.textContent="0",i.appendChild(l)}for(let m=1;m<=A;m++){const l=new Date(r,k,m),g=document.createElement("button");g.type="button",g.className="date-picker__day",g.textContent=String(m),g.setAttribute("aria-label",s[k]+" "+m+", "+r),h(l,a)&&g.classList.add("date-picker__day--today"),t&&h(l,t)&&g.classList.add("date-picker__day--selected"),g.addEventListener("click",function(T){T.stopPropagation(),t=new Date(l.getFullYear(),l.getMonth(),l.getDate()),f(),N()}),i.appendChild(g)}const y=c+A,b=y%7===0?0:7-y%7;for(let m=0;m<b;m++){const l=document.createElement("span");l.className="date-picker__day date-picker__day--pad",l.textContent="0",i.appendChild(l)}}function _(){for(let i=0;i<e.length;i++)v(e[i].grid)}function d(i){const r=parseInt(i.monthSelect.value,10),k=parseInt(i.yearSelect.value,10);!isNaN(r)&&!isNaN(k)&&n.setFullYear(k,r,1)}function x(){w(),_()}function L(i){for(let r=0;r<e.length;r++)if(e[r].wrap.contains(i))return!0;return!1}function S(i){L(i.target)||N()}function H(){o||(o=!0,document.addEventListener("click",S))}function F(){o&&(o=!1,document.removeEventListener("click",S))}function B(i){return!i.dropdown.hidden}function N(){for(let i=0;i<e.length;i++){const r=e[i];r.dropdown.hidden=!0,r.btn.setAttribute("aria-expanded","false")}F()}function O(i){if(N(),i.dropdown.hidden=!1,i.btn.setAttribute("aria-expanded","true"),t)n=new Date(t.getFullYear(),t.getMonth(),1);else{const r=new Date;n=new Date(r.getFullYear(),r.getMonth(),1)}x(),window.setTimeout(H,0)}function Y(i){i.btn.addEventListener("click",function(r){r.stopPropagation(),B(i)?N():O(i)}),i.dropdown.addEventListener("click",function(r){r.stopPropagation()}),i.prevBtn.addEventListener("click",function(r){r.stopPropagation(),n.setMonth(n.getMonth()-1),n.getFullYear()<p&&(n=new Date(p,0,1)),w(),_()}),i.nextBtn.addEventListener("click",function(r){r.stopPropagation(),n.setMonth(n.getMonth()+1),n.getFullYear()>C&&(n=new Date(C,11,1)),w(),_()}),i.monthSelect.addEventListener("change",function(){d(i),w(),_()}),i.yearSelect.addEventListener("change",function(){d(i),w(),_()})}for(let i=0;i<e.length;i++)Y(e[i]);f(),document.addEventListener("keydown",function(i){if(i.key!=="Escape")return;let r=null;for(let k=0;k<e.length;k++)if(B(e[k])){r=e[k];break}r&&(i.preventDefault(),N(),r.btn.focus())})}typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q,{once:!0}):q());function ue(){const e=document.querySelector("#services-picker-input"),s=document.querySelector(".current-location-btn")||document.querySelector("#current-location-btn"),n=document.querySelector(".date-picker")||document.querySelector(".date-picker-wrap");return{ready:!!(e&&s&&n),servicesInput:!!e,currentLocationBtn:!!s,datePicker:!!n}}function pe(){if(typeof document>"u")return;const e=ue();if(!e.ready){console.warn("[searchBarInit] missing required elements",e);return}K(),J(),q()}const G=["Top rated","New","Editor’s pick","Popular","Classic","Staff pick"];function P(e){return e==="Spa"?"Spa & massage":e==="Fitness"?"Gym / Fitness":e==="HairSalon"?"Hair salon":e==="Dentist"?"Dentist":e==="Dermatology"?"Dermatology":e||"Category"}function ge(e,s){var x;const n=R(e.id);if(!n)return null;const t=document.createElement("article");t.className="place-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200",t.setAttribute("data-business-id",n.id),t.setAttribute("data-id",n.id),t.setAttribute("data-category",n.category),t.setAttribute("data-city",n.city),typeof n.lat=="number"&&typeof n.lng=="number"&&(t.setAttribute("data-lat",String(n.lat)),t.setAttribute("data-lng",String(n.lng)));const o=(x=String(n.address||"").split(",")[0])==null?void 0:x.trim();o&&t.setAttribute("data-area-label",o);const u=document.createElement("div");u.className="place-card__image";const p=document.createElement("span");p.className="place-card__badge";const C=typeof s=="number"&&!isNaN(s)?s:0;p.textContent=G[C%G.length],u.appendChild(p);const h=document.createElement("div");h.className="place-card__body";const f=document.createElement("div");f.className="place-card__row";const w=document.createElement("h4");w.className="place-card__name",w.textContent=n.name;const v=document.createElement("span");v.className="place-card__rating",v.title=`${n.averageRating} out of 5`,v.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',v.appendChild(document.createTextNode(String(n.averageRating))),f.appendChild(w),f.appendChild(v);const _=document.createElement("p");_.className="place-card__meta",_.textContent=n.description||"";const d=document.createElement("div");return d.className="place-card__tags",h.appendChild(f),h.appendChild(_),h.appendChild(d),t.appendChild(u),t.appendChild(h),t}function me(e){const s=e.querySelector(".place-card__image");if(!s)return;const n=e.getAttribute("data-business-id"),t=n?R(n):null;let o=s.querySelector("img.place-card__cover");o||(o=document.createElement("img"),o.className="place-card__cover",o.setAttribute("width","720"),o.setAttribute("height","540"),o.setAttribute("loading","lazy"),o.setAttribute("decoding","async"),s.prepend(o));const u=e.querySelector(".place-card__name");o.setAttribute("alt",u&&u.textContent?u.textContent.trim()+" — cover":"Place cover image"),o.removeAttribute("data-cover-fallback"),o.onerror=null;const p=t&&t.coverImage?String(t.coverImage).trim():"";p&&(o.src=p)}function fe(e){const s=[];for(let n=0;n<e.length;n++){const t=R(e[n].id);!t||typeof t.lat!="number"||typeof t.lng!="number"||!Number.isFinite(t.lat)||!Number.isFinite(t.lng)||s.push({id:t.id,lat:t.lat,lng:t.lng,name:t.name})}return s}function Q(e){if(!e)return 0;const s=Number(e.reviewCount||0),n=Number(e.averageRating||0);return s*2+n*10}function he(e){e&&(e.innerHTML=`
    <header class="category-top">
      <a href="./index.html" class="category-back">← Back to home</a>
      <h1 class="category-title" id="category-page-title">Category</h1>
      <div class="hero-search-shell w-full" id="hero-search-shell">
        <div class="hero-search-host flex w-full justify-start" id="hero-search-host">
          <div id="hero-search-bar-anchor" class="hero-search-bar-anchor" aria-hidden="true"></div>
          <div class="search-bar search-bar--hero">
          <form
            id="hero-search-bar"
            class="flex w-full items-center"
            role="search"
            aria-label="Find appointments"
            onsubmit="event.preventDefault()"
          >
            <div class="services-picker-wrap">
              <div class="search-field services-picker-combo" id="services-picker-combobox">
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="services-picker-input"
                  id="services-picker-input"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded="false"
                  aria-controls="services-picker-dropdown"
                  aria-haspopup="listbox"
                  aria-label="Service category"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="All services"
                  data-placeholder-expanded="All services"
                  data-placeholder-compact="Service"
                />
                <div class="services-picker-suffix">
                  <button
                    type="button"
                    class="services-picker-clear-btn"
                    id="services-picker-clear"
                    hidden
                    aria-label="Clear category search"
                    tabindex="-1"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="services-picker-chevron-btn"
                    id="services-picker-chevron"
                    aria-label="Browse all categories"
                    tabindex="-1"
                  >
                    <svg class="search-field__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
              <div
                class="services-picker-dropdown"
                id="services-picker-dropdown"
                role="listbox"
                aria-labelledby="services-picker-input"
                aria-hidden="true"
              >
                <ul class="services-picker-dropdown__list" id="services-picker-list"></ul>
              </div>
            </div>
            <div class="hero-location-query-wrap">
              <input
                type="text"
                id="hero-location-query"
                class="hero-location-query"
                placeholder="City or area"
                aria-label="City or area"
                autocomplete="address-level2"
                maxlength="120"
              />
            </div>
            <div class="current-location-wrap">
              <button
                type="button"
                class="search-field current-location-btn"
                id="current-location-btn"
                aria-label="Filter businesses by your current city. Click again to show all."
              >
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="search-field__label-stack">
                  <span class="search-field__text search-field__text--sticky-full">Current location</span>
                  <span class="search-field__text search-field__text--sticky-compact" aria-hidden="true">Location</span>
                </span>
              </button>
              <div
                class="location-preview-card rounded-2xl"
                id="location-preview-card"
                hidden
                aria-live="polite"
              >
                <div class="location-preview-card__map">
                  <div
                    id="location-preview-map"
                    role="img"
                    aria-label="Map centered on your location"
                  ></div>
                </div>
                <p class="location-preview-card__label" id="location-preview-label"></p>
              </div>
            </div>
            <div class="date-picker-wrap">
              <button
                type="button"
                class="search-field"
                id="date-picker-btn"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="date-picker-dropdown"
                aria-label="Choose appointment date. Any time."
              >
                <svg class="search-field__icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="search-field__label-stack">
                  <span class="search-field__text search-field__text--sticky-full" id="date-picker-label-full">Any time</span>
                  <span class="search-field__text search-field__text--sticky-compact" id="date-picker-label-compact" aria-hidden="true">Time</span>
                </span>
              </button>
              <div
                class="date-picker-dropdown"
                id="date-picker-dropdown"
                role="dialog"
                aria-modal="false"
                aria-label="Select a date"
                hidden
              >
                <div class="date-picker__header">
                  <button type="button" class="date-picker__nav" id="date-picker-prev" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div class="date-picker__month-year">
                    <label class="visually-hidden" for="date-picker-month">Month</label>
                    <select id="date-picker-month" class="date-picker__select" aria-label="Month"></select>
                    <label class="visually-hidden" for="date-picker-year">Year</label>
                    <select id="date-picker-year" class="date-picker__select" aria-label="Year"></select>
                  </div>
                  <button type="button" class="date-picker__nav" id="date-picker-next" aria-label="Next month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
                <div class="date-picker__weekdays" aria-hidden="true">
                  <span class="date-picker__weekday">Sun</span>
                  <span class="date-picker__weekday">Mon</span>
                  <span class="date-picker__weekday">Tue</span>
                  <span class="date-picker__weekday">Wed</span>
                  <span class="date-picker__weekday">Thu</span>
                  <span class="date-picker__weekday">Fri</span>
                  <span class="date-picker__weekday">Sat</span>
                </div>
                <div class="date-picker__grid" id="date-picker-grid" role="grid" aria-label="Days"></div>
              </div>
            </div>
            <button
              type="submit"
              class="search-btn search-btn--icon bg-cta flex shrink-0 items-center justify-center rounded-full self-center text-cta-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span class="visually-hidden">Search</span>
            </button>
          </form>
          </div>
        </div>
      </div>
      <p id="category-page-empty" class="category-page-empty" hidden role="status"></p>
    </header>
    <section class="category-controls" aria-label="Sort and filters">
      <label class="category-sort">
        Sort
        <select id="category-sort">
          <option value="top-rated">Top rated</option>
          <option value="nearest">Nearest</option>
          <option value="most-popular">Most popular</option>
        </select>
      </label>
      <div class="category-chip-row" role="group" aria-label="Quick filters">
        <button type="button" class="category-chip" data-chip-filter="distance-5">Within 5km</button>
        <button type="button" class="category-chip" data-chip-filter="distance-10">Within 10km</button>
        <button type="button" class="category-chip" data-chip-filter="distance-20">Within 20km</button>
        <button type="button" class="category-chip" data-chip-filter="rating-45">Rating 4.5+</button>
        <button type="button" class="category-chip" data-chip-filter="available-today">Available today</button>
        <button type="button" class="category-clear-filters" id="category-clear-filters" disabled>Clear filters</button>
      </div>
    </section>
    <div class="category-split">
      <div id="mainContent">
        <p id="category-result-feedback" class="category-result-feedback" aria-live="polite">0 results found</p>
        <div id="category-page-grid" class="category-grid qlist-trending-place-cards" aria-live="polite"></div>
      </div>
      <aside class="category-map" aria-label="Map of businesses in this category">
        <div
          id="map"
          class="category-map__canvas"
          role="application"
          aria-label="Map of listings in this category"
        ></div>
        <p id="category-page-map-caption" class="category-map__caption">Map</p>
      </aside>
    </div>
  `)}function V(){const e=document.querySelector("main.category-shell");if(!e)return;!!e.querySelector("#hero-search-bar")&&!!e.querySelector("#category-page-grid")&&!!e.querySelector("#mainContent")||he(e);const t=(new URLSearchParams(window.location.search).get("category")||"").trim().toLowerCase(),o=te(t),u=document.getElementById("category-page-title"),p=document.getElementById("category-page-empty"),C=document.getElementById("category-page-grid"),h=document.getElementById("category-page-map-caption"),f=document.getElementById("map"),w=document.getElementById("category-sort"),v=document.querySelectorAll(".category-chip"),_=document.getElementById("category-clear-filters"),d=document.getElementById("category-result-feedback");if(!u||!C)return;if(!o){document.title="Search – QList",u.textContent="Pick a category",p&&(p.hidden=!1,p.textContent="Add ?category= to the URL (for example /search?category=barbershop), or use Browse by category / View all on the home page."),C.innerHTML="",h&&(h.textContent="Map"),f&&(W(),f.innerHTML="",f.hidden=!0),d&&(d.textContent="0 results found");return}document.title=P(o)+" – QList",u.textContent=P(o);const L=(o==="Taxi"?ne.filter(a=>a.category==="Taxi"):ae(o)).map(a=>({row:a,business:R(a.id)}));function S(){const a=document.getElementById("services-picker-combobox");if(!a)return"";const c=a.getAttribute("data-active-category")||"";return String(c).trim()}function H(a){const c=S();return c?a.filter(y=>{var b;return String(((b=y.business)==null?void 0:b.category)||"").trim()===c}):a}const F=z();let B=F?String(F.label||"").split(",")[0].trim():"";function N(a){const c=w?w.value:"top-rated",y=a.slice();return c==="nearest"?(y.sort((b,m)=>{var l,g;return String(((l=b.business)==null?void 0:l.city)||"").localeCompare(String(((g=m.business)==null?void 0:g.city)||""))}),y):c==="most-popular"?(y.sort((b,m)=>Q(m.business)-Q(b.business)),y):(y.sort((b,m)=>{var l,g;return Number(((l=m.business)==null?void 0:l.averageRating)||0)-Number(((g=b.business)==null?void 0:g.averageRating)||0)}),y)}function O(){const a=[];for(let c=0;c<v.length;c++){if(!v[c].classList.contains("is-active"))continue;const y=v[c].getAttribute("data-chip-filter");y&&a.push(y)}return a}function Y(a){const c=O();if(!c.length)return a;const y=c.length*2;let b=Math.max(a.length-y,0);return c.includes("available-today")&&(b=Math.max(b-1,0)),a.slice(0,b)}function i(a){const c=z();if(!c)return a;const y=[];for(let m=0;m<a.length;m++){const l=a[m],g=l.business;!g||typeof g.lat!="number"||typeof g.lng!="number"||!Number.isFinite(g.lat)||!Number.isFinite(g.lng)||y.push({...l,distanceKm:ie(c.lat,c.lng,g.lat,g.lng)})}y.sort(function(m,l){var T,j;const g=Number(m.distanceKm||0)-Number(l.distanceKm||0);return g!==0?g:Number(((T=l.business)==null?void 0:T.averageRating)||0)-Number(((j=m.business)==null?void 0:j.averageRating)||0)});const b=Math.max(4,Math.min(12,y.length));return y.slice(0,b)}function r(){const a=P(o);if(u){if(!B){u.textContent=a,document.title=a+" – QList";return}u.textContent=a+" in "+B,document.title=a+" in "+B+" – QList"}}function k(a){const c=String(P(o)||"Result").trim().toLowerCase();return a===1?c.endsWith("s")?c.slice(0,-1):c:c.endsWith("s")?c:c+"s"}function E(){const a=H(L),c=N(a),y=i(c),b=Y(y);if(C.innerHTML="",!a.length&&p){const l=S();p.hidden=!1,p.textContent=l?"No listings match the selected category.":"No demo listings in this category yet. Pick another category from All categories or change the URL."}else!L.length&&p?(p.hidden=!1,p.textContent="No demo listings in this category yet. Pick another category from All categories or change the URL."):p&&(p.hidden=!0,p.textContent="");for(let l=0;l<b.length;l++){const g=ge(b[l].row,l);g&&C.appendChild(g)}const m=C.querySelectorAll(".place-card");for(let l=0;l<m.length;l++)me(m[l]);if(f&&(W(),f.innerHTML=""),d){const l=k(b.length);d.textContent=b.length+" "+l+" found"}if(!b.length){h&&(h.textContent="No pins — refine filters"),f&&(f.hidden=!0);return}f&&(f.hidden=!1),f&&le({containerEl:f,captionEl:h,points:fe(b.map(l=>l.row)),gridEl:C,canonical:o})}function A(){if(!_)return;let a=!1;for(let c=0;c<v.length;c++)if(v[c].classList.contains("is-active")){a=!0;break}_.disabled=!a}w&&w.addEventListener("change",E);for(let a=0;a<v.length;a++)v[a].addEventListener("click",()=>{v[a].classList.toggle("is-active"),A(),E()});_&&_.addEventListener("click",()=>{for(let a=0;a<v.length;a++)v[a].classList.remove("is-active");A(),E()}),A(),r(),E(),document.addEventListener("qlist:proximity-changed",()=>{const a=z();B=a?String(a.label||"").split(",")[0].trim():"",r(),E()}),document.addEventListener("qlist:filters-changed",E),$(()=>import("./placeCardNav-BhdLa5bI.js"),__vite__mapDeps([0,1]),import.meta.url).then(function(){document.dispatchEvent(new Event("qlist:hv-cards-render"))})}function Z(){pe(),K(),J(),q()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{Z(),V()},{once:!0}):(Z(),V());
