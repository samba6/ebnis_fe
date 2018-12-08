import React, { useState, useMemo, useEffect } from "react";
import { Form, Dropdown, DropdownItemProps } from "semantic-ui-react";
import getDaysInMonth from "date-fns/get_days_in_month";

import { FieldComponentProps } from "../../routes/Exp/exp";

interface DateFieldProps extends FieldComponentProps {
  name: string;
  className?: string;
  value?: Date;
}

const MONTHS = [
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
].map((m, index) => ({ key: index, text: m, value: index }));

const DAYS: DropdownItemProps[] = [];

for (let dayIndex = 1; dayIndex < 32; dayIndex++) {
  DAYS.push({
    key: dayIndex,
    text: dayIndex,
    value: dayIndex
  });
}

function getToday(today: Date) {
  const currYr = today.getFullYear();
  const years = [];

  for (let yrOffset = -2; yrOffset < 2; yrOffset++) {
    const year = currYr + yrOffset;
    years.push({
      key: yrOffset,
      text: year,
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

export function DateField(props: DateFieldProps) {
  const {
    className,
    setValue = () => undefined,
    value = new Date(),
    name: compName
  } = props;
  const { years, currYr, currMonth, currDay } = useMemo(function() {
    return getToday(value);
  }, []);
  const [selectedYear, setSelectedYear] = useState(currYr);
  const [selectedMonth, setSelectedMonth] = useState(currMonth);
  const [selectedDay, setSelectedDay] = useState(currDay);

  useEffect(function initialDateChange() {
    setDate({});
  }, []);

  const dayOptions = useMemo(
    function computeDays() {
      const numDaysInMonth = getDaysInMonth(
        new Date(selectedYear, selectedMonth)
      );

      return DAYS.slice(0, numDaysInMonth);
    },
    [selectedYear, selectedMonth]
  );

  function setDate({ y = selectedYear, m = selectedMonth, d = selectedDay }) {
    setValue(compName, new Date(y, m, d));
  }

  return (
    <Form.Field className={`${className || ""} date-field`}>
      <div className="entry-sub-field_container">
        <label htmlFor="" className="field_label">
          Day
        </label>
        <Dropdown
          fluid
          selection
          name={compName + ".day"}
          compact={true}
          basic={true}
          options={dayOptions}
          defaultValue={currDay}
          onChange={async function(evt, data) {
            const dataVal = (data.value || 0) as number;
            setSelectedDay(dataVal);
            setDate({ d: dataVal });
          }}
        />
      </div>

      <div className="entry-sub-field_container">
        <label htmlFor="" className="field_label">
          Month
        </label>
        <Dropdown
          fluid
          selection
          compact={true}
          options={MONTHS}
          defaultValue={currMonth}
          onChange={function(evt, data) {
            const dataVal = (data.value || 0) as number;
            setSelectedMonth(dataVal);
            setDate({ m: dataVal });
          }}
        />
      </div>

      <div className="entry-sub-field_container">
        <label htmlFor="" className="field_label">
          Year
        </label>
        <Dropdown
          fluid
          selection
          compact={true}
          options={years}
          defaultValue={currYr}
          onChange={function(evt, data) {
            const dataVal = (data.value || 0) as number;
            setSelectedYear(dataVal);
            setDate({ y: dataVal });
          }}
        />
      </div>
    </Form.Field>
  );
}

export default DateField;
