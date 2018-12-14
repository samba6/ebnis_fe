import getDaysInMonth from "date-fns/get_days_in_month";

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export const MONTHS = MONTH_LABELS.map((m, index) => ({
  key: index,
  text: m,
  value: index
}));

export function getToday(today: Date) {
  const currYr = today.getFullYear();
  const years = [];

  for (let yrOffset = -2; yrOffset < 2; yrOffset++) {
    const year = currYr + yrOffset;
    years.push({
      key: yrOffset,
      text: year + "",
      value: year
    });
  }

  return {
    currYr,
    years,
    currMonth: today.getMonth(),
    currDay: today.getDate()
  };
}

export const DAYS: Array<{
  key: number;
  text: string;
  value: number;
}> = [];

for (let dayIndex = 1; dayIndex < 32; dayIndex++) {
  DAYS.push({
    key: dayIndex,
    text: dayIndex + "",
    value: dayIndex
  });
}

export const LABELS = {
  day: "Day",
  month: "Month",
  year: "Year"
};

export function makeFieldNames(compName: string) {
  return Object.keys(LABELS).reduce(
    (acc, k) => {
      acc[k] = compName + "." + k;
      return acc;
    },
    {} as { [k in keyof typeof LABELS]: string }
  );
}

export function getDisplayedDays(year: number, month: number) {
  const numDaysInMonth = getDaysInMonth(new Date(year, month));

  return DAYS.slice(0, numDaysInMonth);
}
