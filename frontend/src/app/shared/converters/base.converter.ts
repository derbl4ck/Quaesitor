function getInputDate(str: string): string {
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:` +
          `${str.slice(10, 12)}:${str.slice(12, 14)}Z`;
}

function getTimestampString(date: string, displayWeekday: boolean = true): string {
  let event = new Date(getInputDate(date));

  if (date.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/g)) {
    event = new Date(date);
  }

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  if (!displayWeekday) {
    options.weekday = 'narrow';
  }

  if (event.toLocaleDateString('de-DE', options) !== 'Invalid Date') {
    return event.toLocaleDateString('de-DE', options) + ' ' + event.toLocaleTimeString('de-DE');
  } else {
    return date;
  }
}

export { getInputDate, getTimestampString };
