import React, { useState, useRef, useCallback, useEffect } from "react";
import makeClassNames from "classnames";
import { StateMachine, Option, Props } from "./dropdown.utils";
import "./dropdown.styles.css";
import { dropdownDomSelectorClass } from "./dropdown.dom";

export function Dropdown<Value = string | number>(props: Props<Value>) {
  const {
    selectedItemClassName = "",
    controlId = "",
    onChange,
    defaultValue,
    options,
    className = "",
    ...rest
  } = props;

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

  const inputDomRef = useRef<HTMLInputElement | null>(null);
  const componentDomRef = useRef<HTMLDivElement | null>(null);
  const selectedText = selectedOption.text || selectedOption.value;

  const closeAndReset = useCallback(() => {
    setState(s => {
      return { ...s, showingOptions: false, inputVal: "" };
    });
  }, []);

  const documentClickListener = useCallback((evt: MouseEvent) => {
    if ((evt.target as HTMLElement).closest("." + dropdownDomSelectorClass)) {
      return;
    }

    // evt.stopImmediatePropagation();
    closeAndReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    const thisComponentDom = componentDomRef.current as HTMLElement;

    if (showingOptions) {
      const selectedItemDom = thisComponentDom.querySelector(
        ".dropdown__item--selected",
      );

      if (selectedItemDom) {
        selectedItemDom.scrollIntoView({ block: "nearest" });
      }
      thisComponentDom.style.zIndex = "2";
    } else {
      thisComponentDom.style.zIndex = "initial";
    }
  }, [showingOptions]);

  const onComponentClick = useCallback(() => {
    setState(s => {
      return s.inputVal === ""
        ? {
            ...s,
            usedOptions: options,
            showingOptions: !s.showingOptions,
          }
        : s;
    });

    (inputDomRef.current as HTMLInputElement).focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={componentDomRef}
      className={makeClassNames({
        [`ebnis-dropdown ${dropdownDomSelectorClass}`]: true,
        [className]: !!className,
      })}
      onKeyDown={e => {
        if (e.key === "Escape") {
          closeAndReset();
        }
      }}
      onClick={onComponentClick}
      {...rest}
    >
      <input
        ref={inputDomRef}
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
            const newState = {
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

            if (!newState.showingOptions) {
              newState.showingOptions = true;
            }

            return newState;
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
          "dropdown__content dropdown__content--full-width": true,
          "dropdown__content--visible": showingOptions,
        })}
      >
        {usedOptions.map((option, index) => {
          const { value, text, content } = option;
          const currentText = text || value;
          const selectedContent = content || text || value;
          const isSelected = value === selectedOption.value;
          const isActive = !isSelected && index === 0;

          return (
            <div
              key={currentText as string}
              className={makeClassNames({
                dropdown__item: true,
                ["dropdown__item--selected " +
                selectedItemClassName]: isSelected,
                "dropdown__item--active": isActive,
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

                onChange(e, value);
                (inputDomRef.current as HTMLInputElement).focus();
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

// istanbul ignore next:
export default function<V>(props: Props<V>) {
  return <Dropdown<V> {...props} />;
}
