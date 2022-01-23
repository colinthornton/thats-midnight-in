import { Temporal, Intl } from "@js-temporal/polyfill";
import { IANAZones } from "./data/IANAZones";

(() => {
  const now = Temporal.Now.instant();
  const localOffsetString = Temporal.Now.timeZone().getOffsetStringFor?.(now);
  const localOffset = parseOffsetString(localOffsetString);
  const zones = generateZones();

  const timeSelect = document.getElementById(
    "time-select"
  ) as HTMLSelectElement;
  const timeZoneList = document.getElementById(
    "time-zone-list"
  ) as HTMLUListElement;

  initializeInterface();

  function generateZones(): { [time: string]: string[] } {
    const zones: { [time: string]: string[] } = {};
    IANAZones.forEach((timeZone) => {
      try {
        const timeZoneName = getTimeZoneName(timeZone);
        const localTime = String(convertTimeZoneToLocalTime(timeZone));

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

  function getTimeZoneName(timeZone: string): string {
    return Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "long",
    })
      .format(now)
      .replace(/^.*(AM|PM) (.*)$/, "$2");
  }

  function convertTimeZoneToLocalTime(timeZone: string): Temporal.PlainTime {
    const offsetString =
      Temporal.TimeZone.from(timeZone).getOffsetStringFor?.(now);
    if (!offsetString) {
      throw new Error(
        `Failed to get offset string for time zone "${timeZone}"`
      );
    }
    const zoneOffset = parseOffsetString(offsetString);
    const localTime = Temporal.PlainTime.from("00:00")
      .add(localOffset)
      .subtract(zoneOffset);
    return localTime;
  }

  function parseOffsetString(offsetString: string): {
    hours: number;
    minutes: number;
  } {
    const matches = offsetString.match(/(\+|-)(\d\d):(\d\d)/);
    if (!matches) {
      throw new Error(`Failed to parse offset string ${offsetString}`);
    }
    const sign = matches[1] as "+" | "-";
    const hours = Number(matches[2]) * (sign === "+" ? 1 : -1);
    const minutes = Number(matches[3]) * (sign === "+" ? 1 : -1);
    return { hours, minutes };
  }

  function updateTimeZoneList() {
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

  function initializeInterface() {
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

    timeSelect.addEventListener("change", updateTimeZoneList);
    updateTimeZoneList();
    const timeSelectLabel = document.querySelector(
      'label[for="time-select"]'
    ) as HTMLLabelElement;
    timeSelectLabel.textContent = Intl.DateTimeFormat("en", {
      timeZoneName: "long",
    })
      .format(now)
      .replace(/^.*(AM|PM) (.*)$/, "$2");
  }
})();
