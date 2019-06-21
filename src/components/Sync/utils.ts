import {
  UnsavedExperiencesProps,
  UnsavedEntriesSavedExperiencesProps
} from "../../state/sync-unsaved-resolver";

export interface OwnProps
  extends UnsavedExperiencesProps,
    UnsavedEntriesSavedExperiencesProps {}

// tslint:disable-next-line: no-empty-interface
export interface Props extends OwnProps {}
