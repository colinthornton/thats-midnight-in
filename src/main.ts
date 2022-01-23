import { Temporal, Intl } from "@js-temporal/polyfill";
import { IANAZones } from "./data/IANAZones";

interface TimeToZonesMap {
  [time: string]: string[];
}

(() => {
  initializeInterface();

  function initializeInterface() {
    const timeSelect = document.getElementById(
      "time-select"
    ) as HTMLSelectElement;

    const zones = generateZones();
    setLocalTimeZone();
    setTimeSelectOption(zones, timeSelect);
    timeSelect.addEventListener("change", () =>
      updateTimeZoneList(zones, timeSelect)
    );
    updateTimeZoneList(zones, timeSelect);
  }

  /**
   * Generate a map of local times to their corresponding midnight time zones
   */
  function generateZones(): TimeToZonesMap {
    const zones: { [time: string]: string[] } = {};
    IANAZones.forEach((timeZone) => {
      try {
        const timeZoneName = getTimeZoneName(timeZone);
        const localTime = String(getLocalTime(timeZone));

        if (!zones[localTime]) {
          zones[localTime] = [];
        }
        if (zones[localTime].includes(timeZoneName)) {
          return;
        }
        zones[localTime].push(timeZoneName);
      } catch {}
    });
    return zones;
  }

  /**
   * Converts the IANA `timeZone` to its full time zone name.
   * If `timeZone` is not specified, returns the local time zone name.
   */
  function getTimeZoneName(timeZone?: string): string {
    const parts = Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "long",
    }).formatToParts(Temporal.Now.instant());
    const timeZoneNamePart = parts.find(({ type }) => type === "timeZoneName");
    if (!timeZoneNamePart) {
      throw new Error("Failed to get time zone name");
    }
    return timeZoneNamePart.value;
  }

  /**
   * Get the local time that corresponds to the IANA `timeZone`'s midnight
   */
  function getLocalTime(timeZone: string): Temporal.PlainTime {
    const localOffset = getTimeZoneOffset(Temporal.Now.timeZone());
    const targetOffset = getTimeZoneOffset(new Temporal.TimeZone(timeZone));
    const midnight = Temporal.PlainTime.from("00:00:00");
    const localTime = midnight.add(localOffset).subtract(targetOffset);
    return localTime;
  }

  /**
   * Get the offset from UTC of IANA `timeZone` in hours and minutes
   */
  function getTimeZoneOffset(timeZone: Temporal.TimeZone): {
    hours: number;
    minutes: number;
  } {
    const offsetString = timeZone.getOffsetStringFor(Temporal.Now.instant());
    const matches = offsetString.match(/(\+|-)(\d\d):(\d\d)/);
    if (!matches) {
      throw new Error(`Failed to parse offset string ${offsetString}`);
    }
    const sign = matches[1];
    const hours = Number(`${sign}${matches[2]}`);
    const minutes = Number(`${sign}${matches[3]}`);
    return { hours, minutes };
  }

  /**
   * Set local time zone display
   */
  function setLocalTimeZone() {
    const label = document.querySelector('label[for="time-select"]');
    if (!label) return;
    label.textContent = getTimeZoneName();
  }

  /**
   * Set time select options
   */
  function setTimeSelectOption(
    zones: TimeToZonesMap,
    timeSelect: HTMLSelectElement
  ) {
    Object.keys(zones)
      .sort(Temporal.PlainTime.compare)
      .map((time) => Temporal.PlainTime.from(time))
      .forEach((time) => {
        const formattedTime = Intl.DateTimeFormat("en", {
          timeStyle: "short",
        }).format(time);

        const option = document.createElement("option");
        option.value = String(time);
        option.textContent = formattedTime;
        timeSelect.appendChild(option);
      });
  }

  /**
   * Update time zones displayed in result list
   */
  function updateTimeZoneList(
    zones: TimeToZonesMap,
    timeSelect: HTMLSelectElement
  ) {
    const timeZoneList = document.getElementById(
      "time-zone-list"
    ) as HTMLUListElement;

    const key = timeSelect.value;
    const timeZoneNames = zones[key];

    timeZoneList.innerHTML = "";
    if (!timeZoneNames) return;
    timeZoneNames.forEach((timeZoneName) => {
      const li = document.createElement("li");
      li.textContent = timeZoneName;
      timeZoneList.appendChild(li);
    });
  }
})();
