import { Observable } from "zen-observable-ts";
import { E2EWindowObject } from "./apollo-setup";

export enum EmitActionType {
  connectionChanged = "@emit-action/connection-changed",
  random = "@emit-action/nothing",
}

export function makeObservable(globals: E2EWindowObject) {
  globals.observable = new Observable<EmitPayload>(emitter => {
    globals.emitter = emitter;
  });

  globals.emitData = function emitData(params: EmitPayload) {
    const { emitter } = globals;

    if (emitter) {
      emitter.next(params);
    }
  };

  return globals;
}

////////////////////////// TYPES ////////////////////////////

export type EmitData = (params: EmitPayload) => void;

export type EmitPayload =
  | {
      type: EmitActionType.connectionChanged;
    } & EmitActionConnectionChangedPayload
  | {
      type: EmitActionType.random;
    };

export interface EmitActionConnectionChangedPayload {
  hasConnection: boolean;
}

export interface ObservableUtils {
  emitData: EmitData;
  observable: Observable<EmitPayload>;
}
