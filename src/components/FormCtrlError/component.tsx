import React, { PropsWithChildren } from "react";
import makeClassName from "classnames";

import "./styles.scss";
import { EbnisComponentProps } from "../../types";

interface Props extends PropsWithChildren<{}>, EbnisComponentProps {
  error?: null | string;
  id?: number | string;
}

export function FormCtrlError(props: Props) {
  const { error, id, className = "", children } = props;

  return children || error ? (
    <div
      className={makeClassName({
        "components-form-control-error": true,
        [className]: !!className
      })}
      data-testid={props["data-testid"] || `form-control-error-${id}`}
    >
      {children || error}
    </div>
  ) : null;
}
