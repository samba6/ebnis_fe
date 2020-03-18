import React, {
  useState,
  useMemo,
  ReactNode,
  useRef,
  useCallback,
  useEffect,
} from "react";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Props } from "./date-field.utils";
import "./date-field.styles.css";
import getDaysInMonth from "date-fns/getDaysInMonth";
import makeClassNames from "classnames";
import { StateMachine, Option } from "./date-field.utils";

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
  const text = (dayIndex + "").padStart(2, "0");

  return {
    key: dayIndex,
    text,
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
  const { className, onChange, value, name: compName } = props;

  const fieldNames = useMemo(() => {
    return Object.keys(LABELS).reduce((acc, k) => {
      acc[k] = compName + "." + k;
      return acc;
    }, {} as { [k in keyof typeof LABELS]: string });
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
    onChange(compName, updatedDate);
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <Dropdown1
          onChanged={t => {
            console.log(
              `\n\t\tLogging start\n\n\n\n label\n`,
              t,
              `\n\n\n\n\t\tLogging ends\n`,
            );
          }}
          options={MONTHS_DROP_DOWN_OPTIONS}
          defaultValue={currMonth}
        />
      </div>

      <div
        className={`${className || ""} date-field light-border`}
        id={`date-field-input-${compName}`}
      >
        <div>
          <label className="field_label">{LABELS.day}</label>

          <Dropdown
            search={true}
            fluid={true}
            selection={true}
            id={`date-field-input-${fieldNames.day}`}
            name={fieldNames.day}
            compact={true}
            basic={true}
            options={dayOptions}
            defaultValue={currDay}
            onChange={function(_, data) {
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
            search={true}
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
            search={true}
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
      </div>
    </>
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

const domPrefix = "ebnis-dropdown";

export function Dropdown1<Value = string | number>({
  controlId = "",
  onChanged,
  defaultValue,
  options,
}: {
  controlId?: string;
  onChanged: (inputVal: Value) => void;
  defaultValue?: Value;
  options: {
    value: Value;
    text?: string;
    content?: ReactNode;
  }[];
}) {
  const [state, setState] = useState<StateMachine<Value>>(() => {
    let selectedIndex = -1;
    let index = 0;
    let selectedOption: null | Option<Value> = null;

    for (const option of options) {
      const { value } = option;
      if (value === defaultValue) {
        selectedIndex = index;
        selectedOption = option;
        break;
      }

      index++;
    }

    return {
      selectedIndex,
      usedOptions: options,
      inputVal: "",
      showingOptions: false,
      selectedOption: selectedOption ? selectedOption : options[0],
    };
  });

  const { usedOptions, inputVal, showingOptions, selectedOption } = state;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedText = selectedOption.text || selectedOption.value;

  const documentClickListener = useCallback((evt: MouseEvent) => {
    if ((evt.target as HTMLElement).closest("#" + domPrefix)) {
      return;
    }

    setState(s => {
      return { ...s, showingOptions: false };
    });
  }, []);

  useEffect(() => {
    document.documentElement.addEventListener(
      "click",
      documentClickListener,
      false,
    );

    return () => {
      document.documentElement.removeEventListener(
        "click",
        documentClickListener,
        false,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="dropdown"
      id={domPrefix}
      onClick={() => {
        setState(s => {
          return {
            ...s,
            usedOptions: options,
            showingOptions: !showingOptions,
          };
        });

        (inputRef.current as HTMLInputElement).focus();
      }}
    >
      <input
        ref={inputRef}
        className="dropdown__input"
        tabIndex={0}
        autoComplete="off"
        type="text"
        id={controlId}
        value={inputVal}
        onChange={e => {
          const inputValue = e.currentTarget.value;
          const inputValueLower = inputValue.toLocaleLowerCase();

          setState(s => {
            return {
              ...s,
              inputVal: inputValue,
              usedOptions: options.filter(({ value, text }) => {
                if (text) {
                  return text.toLocaleLowerCase().includes(inputValueLower);
                }

                return ("" + value)
                  .toLocaleLowerCase()
                  .includes(inputValueLower);
              }),
            };
          });
        }}
      />

      <div
        className={makeClassNames({
          dropdown__text: true,
          "dropdown__text--hidden": !!inputVal,
        })}
      >
        {selectedText}
      </div>

      <span className="dropdown__pointer" />

      <div
        className={makeClassNames({
          dropdown__options: true,
          "dropdown__options--visible": showingOptions,
        })}
      >
        {usedOptions.map(option => {
          const { value, text, content } = option;
          const currentText = text || value;
          const selectedContent = content || text || value;

          return (
            <div
              key={currentText as string}
              className={makeClassNames({
                dropdown__option: true,
                "dropdown__option--selected": value === selectedOption.value,
                "dropdown__option--active": false,
              })}
              onClick={e => {
                e.stopPropagation();

                setState(s => {
                  return {
                    ...s,
                    inputVal: "",
                    showingOptions: false,
                    selectedOption: option,
                  };
                });

                onChanged(value);
                (inputRef.current as HTMLInputElement).focus();
              }}
            >
              {selectedContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
