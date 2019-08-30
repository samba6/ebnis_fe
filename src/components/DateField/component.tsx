import React, { useState, useMemo } from "react";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import { Props } from "./utils";
import "./date-field.styles.scss";
import getDaysInMonth from "date-fns/get_days_in_month";

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
  content: <span className={`js-date-field-input-month-${m}`}>{m}</span>,
}));

export const DAYS = Array.from<
  undefined,
  {
    key: number;
    text: string;
    value: number;
    content: JSX.Element;
  }
>({ length: 31 }, (_, index) => {
  const dayIndex = index + 1;

  return {
    key: dayIndex,
    text: dayIndex + "",
    value: dayIndex,
    content: (
      <span className={`text js-date-field-input-day-${dayIndex}`}>
        {dayIndex}
      </span>
    ),
  };
});

const LABELS = {
  day: "Day",
  month: "Month",
  year: "Year",
};

export function DateField(props: Props) {
  const { className, setValue, value, name: compName } = props;

  const fieldNames = useMemo(() => {
    return Object.keys(LABELS).reduce(
      (acc, k) => {
        acc[k] = compName + "." + k;
        return acc;
      },
      {} as { [k in keyof typeof LABELS]: string },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { years, currYr, currMonth, currDay } = useMemo(
    function() {
      return getToday(value, fieldNames.year);
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
    setValue(compName, updatedDate);
  }

  return (
    <Form.Field
      className={`${className || ""} components-date-field light-border`}
      id={`date-field-input-${compName}`}
    >
      <div>
        <label className="field_label">{LABELS.day}</label>

        <Dropdown
          fluid={true}
          selection={true}
          id={`date-field-input-${fieldNames.day}`}
          name={fieldNames.day}
          compact={true}
          basic={true}
          options={dayOptions}
          defaultValue={currDay}
          onChange={async function(_, data) {
            const dataVal = data.value as number;
            setSelectedDay(dataVal);
            setDate({ d: dataVal });
          }}
        />
      </div>

      <div>
        <label
          htmlFor={`date-field-input-${fieldNames.month}`}
          className="field_label"
        >
          {LABELS.month}
        </label>
        <Dropdown
          fluid={true}
          selection={true}
          id={`date-field-input-${fieldNames.month}`}
          name={fieldNames.month}
          compact={true}
          options={MONTHS_DROP_DOWN_OPTIONS}
          defaultValue={currMonth}
          onChange={function(_, data) {
            const dataVal = data.value as number;
            setSelectedMonth(dataVal);
            setDate({ m: dataVal });
          }}
        />
      </div>

      <div>
        <label
          htmlFor={`date-field-input-${fieldNames.year}`}
          className="field_label"
        >
          {LABELS.year}
        </label>
        <Dropdown
          fluid={true}
          selection={true}
          compact={true}
          id={`date-field-input-${fieldNames.year}`}
          name={fieldNames.year}
          options={years}
          defaultValue={currYr}
          onChange={function(_, data) {
            const dataVal = data.value as number;
            setSelectedYear(dataVal);
            setDate({ y: dataVal });
          }}
        />
      </div>
    </Form.Field>
  );
}

function getToday(today: Date, fieldName: string) {
  const currYr = today.getFullYear();
  const years = [];

  for (let yrOffset = -2; yrOffset < 2; yrOffset++) {
    const year = currYr + yrOffset;
    years.push({
      key: yrOffset,
      text: year + "",
      value: year,
      content: (
        <span className="text" id={`date-field-input-${fieldName}-${year}`}>
          {year}
        </span>
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
