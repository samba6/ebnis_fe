import React, { useState, useMemo, ReactNode } from "react";
import { Props, LABELS } from "./date-field.utils";
import "./date-field.styles.css";
import getDaysInMonth from "date-fns/getDaysInMonth";
import Dropdown from "../Dropdown/dropdown-component";
import {
  makeMonthItemSelector,
  makeDayItemSelector,
  selectedItemClassName,
  makeYearItemSelector,
  dayDropdownSelector,
  monthDropdownSelector,
  yearDropdownSelector,
} from "./date-field.dom";

const MONTHS_DROP_DOWN_OPTIONS = [
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
  "Dec",
].map((m, index) => ({
  key: index,
  text: m,
  value: index,
  content: <span className={makeMonthItemSelector(m)}>{m}</span>,
}));

export const DAYS = Array.from<
  undefined,
  {
    key: number;
    text: string;
    value: number;
    content: ReactNode;
  }
>({ length: 31 }, (_, index) => {
  const dayIndex = index + 1;
  const text = (dayIndex + "").padStart(2, "0");

  return {
    key: dayIndex,
    text,
    value: dayIndex,
    content: <span className={makeDayItemSelector(dayIndex)}>{dayIndex}</span>,
  };
});

export function DateField(props: Props) {
  const { className = "", onChange, value, name: compName } = props;

  const { years, currYr, currMonth, currDay } = useMemo(
    function() {
      return getToday(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );

  const [selectedYear, setSelectedYear] = useState(currYr);
  const [selectedMonth, setSelectedMonth] = useState(currMonth);
  const [selectedDay, setSelectedDay] = useState(currDay);

  const dayOptions = useMemo(
    function computeDays() {
      return getDisplayedDays(selectedYear, selectedMonth);
    },
    [selectedYear, selectedMonth],
  );

  function setDate({ y = selectedYear, m = selectedMonth, d = selectedDay }) {
    const updatedDate = new Date(y, m, d);
    onChange(compName, updatedDate);
  }

  return (
    <div className={`${className} date-field light-border`}>
      <div>
        <label className="field_label">{LABELS.day}</label>

        <Dropdown
          className={dayDropdownSelector}
          selectedItemClassName={selectedItemClassName}
          options={dayOptions}
          defaultValue={currDay}
          onChange={function(_, data) {
            setSelectedDay(data);
            setDate({ d: data });
          }}
        />
      </div>

      <div>
        <label className="field_label">{LABELS.month}</label>

        <Dropdown
          className={monthDropdownSelector}
          selectedItemClassName={selectedItemClassName}
          options={MONTHS_DROP_DOWN_OPTIONS}
          defaultValue={currMonth}
          onChange={function(_, dataVal) {
            setSelectedMonth(dataVal);
            setDate({ m: dataVal });
          }}
        />
      </div>

      <div>
        <label className="field_label">{LABELS.year}</label>

        <Dropdown
          className={yearDropdownSelector}
          selectedItemClassName={selectedItemClassName}
          options={years}
          defaultValue={currYr}
          onChange={function(_, dataVal) {
            setSelectedYear(dataVal);
            setDate({ y: dataVal });
          }}
        />
      </div>
    </div>
  );
}

function getToday(today: Date) {
  const currYr = today.getFullYear();
  const years = [];

  for (let yrOffset = -2; yrOffset < 2; yrOffset++) {
    const year = currYr + yrOffset;
    years.push({
      key: yrOffset,
      text: year + "",
      value: year,
      content: (
        <span className={`text ${makeYearItemSelector(year)}`}>{year}</span>
      ),
    });
  }

  return {
    currYr,
    years,
    currMonth: today.getMonth(),
    currDay: today.getDate(),
  };
}

export function getDisplayedDays(year: number, month: number) {
  const numDaysInMonth = getDaysInMonth(new Date(year, month));

  return DAYS.slice(0, numDaysInMonth);
}
