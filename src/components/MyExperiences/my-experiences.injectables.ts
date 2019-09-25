import { Cancelable } from "lodash";

export function cleanUpOnSearchExit(cancellable: Cancelable) {
  cancellable.cancel();
}

export const searchDebounceTimeoutMs = 70;
