import React, { useEffect } from "react";
import { RouteComponentProps } from "@reach/router";

import { Page404 } from "./Page404";
import {
  setDocumentTitle,
  makeSiteTitle,
  PAGE_NOT_FOUND_TITLE,
} from "../constants";

export type Props = RouteComponentProps & { default: boolean };

export function NotFound({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: defaultVal,
  ...props
}: Props) {
  useEffect(() => {
    setDocumentTitle(makeSiteTitle(PAGE_NOT_FOUND_TITLE));

    return setDocumentTitle;
  }, []);

  return <Page404 {...props} />;
}
