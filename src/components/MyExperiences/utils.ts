import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";

import { GetExpGqlProps } from "../../graphql/exps.query";

export interface OwnProps extends RouteComponentProps<{}> {}

export interface Props extends OwnProps, GetExpGqlProps {}

export interface State {
  readonly toggleDescriptionStates: {
    [k: string]: boolean;
  };
}

export const initialState: State = {
  toggleDescriptionStates: {}
};

export enum ActionTypes {
  setToggleDescription = "setToggleDescription"
}

type ActionPayload = null | string;

interface Action {
  type: ActionTypes;
  payload?: ActionPayload;
}

const reducerObject: {
  [k in keyof typeof ActionTypes]: (
    prevState: State,
    payload: ActionPayload
  ) => State
} = {
  [ActionTypes.setToggleDescription]: (prevState, payload) => {
    const { toggleDescriptionStates } = prevState;
    const toggleState = toggleDescriptionStates[payload as string];
    toggleDescriptionStates[payload as string] = !toggleState;

    return {
      ...prevState,
      toggleDescriptionStates
    };
  }
};

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, payload }
) => {
  const reducerFn = reducerObject[type];

  // istanbul ignore next:
  // if (reducerFn) {
  return reducerFn(prevState, payload as ActionPayload);
  // }

  // return prevState;
};

export type DispatchType = Dispatch<Action>;
