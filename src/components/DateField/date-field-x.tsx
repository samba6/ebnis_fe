import React, { useState, useMemo, useRef } from "react";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import {
  MONTHS,
  getToday,
  getDisplayedDays,
  LABELS,
  makeFieldNames,
  Props,
} from "./date-field";
import "./styles.scss";

export function DateField(props: Props) {
  const { className, setValue, value, name: compName } = props;

  const fieldNames = useRef(makeFieldNames(compName)).current;

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
      data-testid={`date-field-${compName}`}
    >
      <div>
        <label htmlFor={fieldNames.day} className="field_label">
          {LABELS.day}
        </label>

        <Dropdown
          fluid={true}
          selection={true}
          data-testid={fieldNames.day}
          id={fieldNames.day}
          name={fieldNames.day}
          compact={true}
          basic={true}
          options={dayOptions}
          defaultValue={currDay}
          onChange={async function(evt, data) {
            const dataVal = data.value as number;
            setSelectedDay(dataVal);
            setDate({ d: dataVal });
          }}
        />
      </div>

      <div>
        <label htmlFor={fieldNames.month} className="field_label">
          {LABELS.month}
        </label>
        <Dropdown
          fluid={true}
          selection={true}
          data-testid={fieldNames.month}
          id={fieldNames.month}
          name={fieldNames.month}
          compact={true}
          options={MONTHS}
          defaultValue={currMonth}
          onChange={function(evt, data) {
            const dataVal = data.value as number;
            setSelectedMonth(dataVal);
            setDate({ m: dataVal });
          }}
        />
      </div>

      <div>
        <label htmlFor={fieldNames.year} className="field_label">
          {LABELS.year}
        </label>
        <Dropdown
          fluid={true}
          selection={true}
          compact={true}
          data-testid={fieldNames.year}
          id={fieldNames.year}
          name={fieldNames.year}
          options={years}
          defaultValue={currYr}
          onChange={function(evt, data) {
            const dataVal = data.value as number;
            setSelectedYear(dataVal);
            setDate({ y: dataVal });
          }}
        />
      </div>
    </Form.Field>
  );
}

export default DateField;
