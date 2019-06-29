import React, { PropsWithChildren, useRef, useState, useEffect } from "react";

import "./styles.scss";
import makeClassNames from "classnames";
import { LoadingComponentProps } from "react-loadable";

export function LoadableLoading(props: LoadingComponentProps) {
  return <Loading loadableProps={props} />;
}

export function Loading({
  className,
  children,
  loading = true,
  loadableProps,
  ...props
}: PropsWithChildren<{
  className?: string;
  loading?: boolean;
  loadableProps?: LoadingComponentProps;
}>) {
  const loadingRef = useRef<number | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (loadingRef.current) {
        clearTimeout(loadingRef.current);
      }
      setShouldShow(false);
    } else {
      loadingRef.current = (setTimeout(() => {
        setShouldShow(true);
      }, 1000) as unknown) as number;
    }

    return () => {
      if (loadingRef.current) {
        clearTimeout(loadingRef.current);
      }
    };
  }, [loading]);

  return shouldShow ? (
    <div className="components-loading" data-testid="loading-spinner">
      <div
        className={makeClassNames({
          "components-loading__spinner": true,
          [className || ""]: !!className,
        })}
        {...props}
      >
        <div className="double-bounce1" />
        <div className="double-bounce2" />
      </div>

      {children}
    </div>
  ) : null;
}
