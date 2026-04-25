/**
 * Home shell script order: browse-row DOM normalization before layout capture,
 * then the rest of the home modules (same set as `entry.js` home branch).
 */
import "./placeCardGeoAttrs.js";
import "./homeDiscoveryBrowseMount.js";
import "./homeCategorySearchLayout.js";
import "./heroLocationQuery.js";
import "./currentLocation.js";
import "./serviceCategoryFilter.js";
import "./homeBrowseCategoryGrid.js";
import "./exploreAllHome.js";
import "./homeDiscoveryRows.js";
import "./homeDiscoveryFolderCovers.js";
import "./cardTilt.js";
import "./placeCardNav.js";
import "./businessFavorites.js";

import("./featureMount.jsx").catch(function (e) {
  console.warn("[qlist] Feature cards failed to load:", e);
});
