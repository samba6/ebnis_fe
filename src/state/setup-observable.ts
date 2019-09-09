import { Observable } from "zen-observable-ts";
import { E2EWindowObject } from "./apollo-setup";

export enum EmitActionType {
  connectionChanged = "@emit-action/connection-changed",
  nothing = "@emit-action/nothing",
}

export function makeObservable(globals: E2EWindowObject) {
  globals.observable = new Observable<EmitPayload>(emitter => {
    globals.emitter = emitter;
  });

  globals.emitData = function emitData(params: EmitPayload) {
    const { emitter, emitting } = globals;

    if (emitter) {
      emitter.next(params);
      globals.emitting = true;
      return;
    }

    // the emitter may not have been initialized by the first emit, so we retry
    // for 500ms

    if (emitting) {
      return;
    }

    const then = new Date().getTime();

    let timeoutId = setTimeout(function loopTillExit() {
      const { emitter, emitting } = globals;

      if (emitter) {
        emitter.next(params);
        clearTimeout(timeoutId);
        return;
      }

      if (emitting || new Date().getTime() - then >= 500) {
        clearTimeout(timeoutId);
        return;
      }

      timeoutId = setTimeout(loopTillExit, 25);
    }, 25);
  };

  return globals;
}

////////////////////////// TYPES ////////////////////////////

export type EmitData = (params: EmitPayload) => void;

export type EmitPayload =
  | {
      type: EmitActionType.connectionChanged;
    } & ConnectionChangedPayload
  | {
      type: EmitActionType.nothing;
    };

export interface ConnectionChangedPayload {
  hasConnection: boolean;
}

export interface ObservableUtils {
  emitData: EmitData;
  observable: Observable<EmitPayload>;
}
