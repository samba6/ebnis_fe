import { MutableRefObject } from "react";

// istanbul ignore next: tested via signup
export function scrollToTop(mainRef: MutableRefObject<HTMLDivElement | null>) {
  if (mainRef && mainRef.current) {
    mainRef.current.scrollTop = 0;
  }
}
