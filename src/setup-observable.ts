import { Observable, ZenObservable } from "zen-observable-ts";

export enum EmitAction {
  connectionChanged = "@emit-action/connection-changed",
}

type EmitPayload = [EmitAction.connectionChanged, boolean];

let observable: Observable<EmitPayload>;

let emitter: ZenObservable.SubscriptionObserver<EmitPayload>;

function makeObservable() {
  observable = new Observable<EmitPayload>(observer => {
    emitter = observer;
  });
}

export function emitData(params: EmitPayload) {
  if (!observable) {
    makeObservable();
  }

  if (emitter) {
    emitter.next(params);
  }
}

export function getObservable() {
  if (observable) {
    return observable;
  }

  makeObservable();

  return observable;
}
