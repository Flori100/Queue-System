import { initServicesPicker } from "./serviceCategoryFilter.js";
import { initCurrentLocationPicker } from "./currentLocation.js";
import { initDatePicker } from "./datePickerInit.js";

function hasSearchBarElements() {
  const servicesInput = document.querySelector("#services-picker-input");
  const currentLocationBtn =
    document.querySelector(".current-location-btn") ||
    document.querySelector("#current-location-btn");
  const datePicker =
    document.querySelector(".date-picker") || document.querySelector(".date-picker-wrap");
  return {
    ready: !!(servicesInput && currentLocationBtn && datePicker),
    servicesInput: !!servicesInput,
    currentLocationBtn: !!currentLocationBtn,
    datePicker: !!datePicker,
  };
}

export function initSearchBar() {
  if (typeof document === "undefined") return;
  const checks = hasSearchBarElements();
  if (!checks.ready) {
    console.warn("[searchBarInit] missing required elements", checks);
    return;
  }
  initServicesPicker();
  initCurrentLocationPicker();
  initDatePicker();
}

