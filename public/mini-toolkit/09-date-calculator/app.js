'use strict';

const { setStatus } = AppCore;
const form = document.querySelector('form');
const status = document.getElementById('status');
const millisecondsPerDay = 86400000;

function utcDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return NaN;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const date = Number(match[3]);
  const timestamp = new Date(0);
  timestamp.setUTCHours(0, 0, 0, 0);
  timestamp.setUTCFullYear(year, month, date);

  return timestamp.getUTCFullYear() === year
    && timestamp.getUTCMonth() === month
    && timestamp.getUTCDate() === date
    ? timestamp.getTime()
    : NaN;
}

function countWeekdays(firstDay, inclusiveDays) {
  const fullWeeks = Math.floor(inclusiveDays / 7);
  const remainingDays = inclusiveDays % 7;
  let weekdays = fullWeeks * 5;
  const firstWeekday = new Date(firstDay).getUTCDay();

  for (let offset = 0; offset < remainingDays; offset++) {
    const weekday = (firstWeekday + offset) % 7;
    if (weekday !== 0 && weekday !== 6) weekdays++;
  }
  return weekdays;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const start = utcDay(String(values.get('start')));
  const end = utcDay(String(values.get('end')));
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    setStatus(status, 'Choose two valid calendar dates.');
    return;
  }

  const firstDay = Math.min(start, end);
  const daysApart = Math.abs(end - start) / millisecondsPerDay;
  const inclusiveDays = daysApart + 1;
  const weekdays = countWeekdays(firstDay, inclusiveDays);
  const direction = end < start ? ' · Dates were entered in reverse order' : '';
  setStatus(
    status,
    `${daysApart} days apart · ${Math.floor(daysApart / 7)} weeks and ${daysApart % 7} days · ${weekdays} weekdays\n${inclusiveDays} days inclusive${direction}`
  );
});
