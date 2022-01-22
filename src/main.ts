import { Temporal, Intl } from "@js-temporal/polyfill";
import { IANAZones } from "./data/IANAZones";

const zones: { [offset: string]: string[] } = {};
const now = Temporal.Now.instant();

function setZone(offset: string, timeZoneName: string) {
  if (!zones[offset]) {
    zones[offset] = [];
  }
  if (zones[offset].includes(timeZoneName)) return;
  zones[offset].push(timeZoneName);
}

function getTimeZoneName(timeZone?: string): string {
  return Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "long",
  })
    .format(now)
    .replace(/.*(AM|PM) (.*)$/, "$2");
}

IANAZones.forEach((timeZone) => {
  try {
    const tz = Temporal.TimeZone.from(timeZone);
    const offset = tz.getOffsetStringFor?.(now);
    if (!offset) return;
    const timeZoneName = getTimeZoneName(timeZone);
    setZone(offset, timeZoneName);
  } catch {
    return;
  }
});

const hourSelect = document.getElementById("hour-select") as HTMLSelectElement;
const timezoneList = document.getElementById(
  "timezone-list"
) as HTMLUListElement;

function updateResults() {
  const now = new Date();
  const localeTzOffset = now.getTimezoneOffset();
  const offset = localeTzOffset + Number(hourSelect.value) * 60;
  const sign = offset > 0 ? "-" : "+";
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const mm = String(offset % 60).padStart(2, "0");
  const offsetString = `${sign}${hh}:${mm}`;
  const timezones = zones[offsetString];

  timezoneList.innerHTML = "";
  timezones?.forEach((timezone) => {
    const li = document.createElement("li");
    li.textContent = timezone;
    timezoneList.appendChild(li);
  });
}

hourSelect?.addEventListener("change", updateResults);

document.querySelector('label[for="hour-select"] span')!.textContent =
  getTimeZoneName();

updateResults();
