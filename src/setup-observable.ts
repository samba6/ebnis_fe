import { Observable } from "zen-observable-ts";
import { E2EWindowObject } from "./state/apollo-setup";

export enum EmitAction {
  connectionChanged = "@emit-action/connection-changed",
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

export type EmitPayload = [EmitAction.connectionChanged, boolean];

export interface ObservableUtils {
  emitData: EmitData;
  observable: Observable<EmitPayload>;
}
