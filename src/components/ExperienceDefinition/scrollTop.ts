import { MutableRefObject } from "react";

// istanbul ignore next: trivial
export function scrollTop(routeRef: MutableRefObject<HTMLDivElement | null>) {
  if (routeRef.current) {
    routeRef.current.scrollTop = 0;
  }
}
