import React, { useState } from "react";
import { Form, Dropdown, DropdownItemProps } from "semantic-ui-react";

import DateField from "../DateField";
import { FieldComponentProps, FormObjVal } from "../../routes/Exp/exp";

interface DateTimeProps extends FieldComponentProps {
  className?: string;
}

const HOUR_OPTIONS: DropdownItemProps[] = [];

for (let hrIndex = 0; hrIndex < 24; hrIndex++) {
  HOUR_OPTIONS.push({
    key: hrIndex,
    text: ("" + hrIndex).padStart(2, "0"),
    value: hrIndex
  });
}

const MINUTE_OPTIONS: DropdownItemProps[] = [];

for (let minIndex = 0; minIndex < 60; minIndex++) {
  MINUTE_OPTIONS.push({
    key: minIndex,
    text: ("" + minIndex).padStart(2, "0"),
    value: minIndex
  });
}

export function DateTimeField(props: DateTimeProps) {
  const { className, name: compName, setValue = () => null } = props;
  const [datetime, setDatetime] = useState(new Date());

  function setDateVal(a: string, date: FormObjVal) {
    const date1 = date as Date;
    setDateTimeVal({}, date1);
  }

  function setDateTimeVal(
    { h = datetime.getHours(), m = datetime.getMinutes() },
    date = datetime
  ) {
    date.setHours(h);
    date.setMinutes(m);
    setDatetime(date);
    setValue(compName, date);
  }

  return (
    <Form.Field className={`${className || ""} `}>
      <DateField
        name={compName + ".date"}
        value={datetime}
        setValue={setDateVal}
      />

      <div className="datetime-field-time">
        <div className="entry-sub-field_container">
          <label htmlFor="" className="field_label">
            Hour
          </label>
          <Dropdown
            fluid
            selection
            name={compName + ".hr"}
            compact={true}
            options={HOUR_OPTIONS}
            defaultValue={datetime.getHours()}
            onChange={function dropDownHrChanged(evt, data) {
              const dataVal = data.value as number;
              setDateTimeVal({ h: dataVal });
            }}
          />
        </div>

        <div className="entry-sub-field_container">
          <label htmlFor="" className="field_label">
            Minute
          </label>
          <Dropdown
            fluid
            selection
            name={compName + ".min"}
            compact={true}
            options={MINUTE_OPTIONS}
            defaultValue={datetime.getMinutes()}
            onChange={function dropDownMinChanged(evt, data) {
              const dataVal = data.value as number;
              setDateTimeVal({ m: dataVal });
            }}
          />
        </div>
      </div>
    </Form.Field>
  );
}

export default DateTimeField;
