import { EbnisComponentProps } from "../../types";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { Reducer, Dispatch } from "react";
import {
  ActionType as EditEntryActionTypes,
  Action as EditEntryAction,
} from "../EditEntry/edit-entry-utils";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";

export enum EntryActionType {
  editClicked = "@entry/edit-clicked",
}

export const reducer: Reducer<StateMachine, EntryAction> = (state, action) =>
  wrapReducer(
    state,
    action,
    (previousState, { type }) => {
      return immer(previousState, proxy => {
        switch (type) {
          case EntryActionType.editClicked:
            proxy.stateValue = "editing";
            break;

          case EditEntryActionTypes.DESTROYED:
            proxy.stateValue = "idle";
            break;
        }
      });
    },
    // true
  );

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState(): StateMachine {
  return {
    stateValue: "idle",
  };
}

////////////////////// END STATE UPDATE SECTION /////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly stateValue: "idle" | "editing";
}

export type EntryDispatchType = Dispatch<EntryAction>;

export type EntryAction =
  | EditEntryAction
  | {
      type: EntryActionType.editClicked;
    };

export interface CallerProps extends EbnisComponentProps {
  entry: EntryFragment;
  experience: ExperienceFragment;
  entriesLen: number;
  index: number;
  className?: string;
}

export type Props = CallerProps;
