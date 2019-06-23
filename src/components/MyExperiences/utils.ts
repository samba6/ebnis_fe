import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";
import { WithApolloClient } from "react-apollo";

import { GetExperiencesProps } from "../../graphql/exps.query";
import { UnsavedExperiencesQueryProps } from "../ExperienceDefinition/resolver-utils";

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}>,
    UnsavedExperiencesQueryProps {}

export interface Props extends OwnProps, GetExperiencesProps {}

export interface State {
  readonly toggleDescriptionStates: {
    [k: string]: boolean;
  };
}

export const initialState: State = {
  toggleDescriptionStates: {}
};

export enum ActionTypes {
  setToggleDescription = "@components/MyExpriences/setToggleDescription"
}

type ActionPayload = null | string;

interface Action {
  type: ActionTypes;
  payload?: ActionPayload;
}

const reducerObject: {
  [k in ActionTypes]: (prevState: State, payload: ActionPayload) => State
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

  return reducerFn(prevState, payload as ActionPayload);
};

export type DispatchType = Dispatch<Action>;
