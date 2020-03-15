/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any*/
import { Reducer, useEffect } from "react";
import lodashIsEqual from "lodash/isEqual";
import { doNotLog } from "./state/apollo-middlewares";

const isDevEnv = process.env.NODE_ENV === "development";
const isTestEnv = process.env.NODE_ENV === "test";

export const logger = async (prefix: keyof Console, tag: any, ...data: any) => {
  if (isDevEnv) {
    console[prefix](
      "\n\n     =======logging starts======\n",
      tag,
      "\n",
      ...data,
      "\n     =======logging ends======\n",
    );
  }
};

export function wrapReducer<State, Action>(
  prevState: State,
  action: Action,
  reducer: Reducer<State, Action>,
  shouldWrap?: boolean,
) {
  if (shouldWrap === false && doNotLog()) {
    return reducer(prevState, action);
  }

  if (shouldWrap === true || isDevEnv) {
    const envAction = objectForEnv(action);

    console.log(
      "\nprevious state = \n\t",
      objectForEnv(prevState),

      "\n\n\nupdate with = \n\t",
      envAction,
    );

    const nextState = reducer(prevState, action);

    console.log(
      "\nnext state = \n\t",
      objectForEnv(nextState),

      "\n\n\nupdate with = \n\t",
      envAction,

      "\n\n\nDifferences = \n\t",
      objectForEnv(deepObjectDifference(nextState, prevState)),
    );

    return nextState;
  }

  return reducer(prevState, action);
}

function deepObjectDifference(
  compareObject: KStringAny,
  baseObject: KStringAny,
) {
  function differences(newObject: KStringAny, baseObjectDiff: KStringAny) {
    return Object.entries(newObject).reduce((acc, [key, value]) => {
      const baseValue = baseObjectDiff[key];

      if (!lodashIsEqual(value, baseValue)) {
        acc[key] =
          isPlainObject(baseValue) && isPlainObject(value)
            ? differences(value, baseValue)
            : Array.isArray(value) && Array.isArray(baseValue)
            ? diffArray(value, baseValue, differences)
            : value;
      }

      return acc;
    }, {} as KStringAny);
  }

  return differences(compareObject, baseObject);
}

function diffArray(
  value: any[],
  baseValue: any[],
  diffFn: (a: KStringAny, b: KStringAny) => KStringAny,
) {
  return value.reduce((acc, x, index) => {
    const y = baseValue[index];

    if (!y) {
      acc.push(x);
      return acc;
    }

    acc.push(diffFn(x, y));
    return acc;
  }, [] as any[]);
}

function isPlainObject(obj: object) {
  return Object.prototype.toString.call(obj).includes("Object");
}

function objectForEnv(obj: any) {
  return isTestEnv ? JSON.stringify(obj, null, 2) : obj;
}

export function useLogger(data: any, tag = "") {
  useEffect(() => {
    if (!isDevEnv) {
      return;
    }

    logger("log", tag, data);
  });
}

interface KStringAny {
  [k: string]: any;
}
