import { Sync as Comp } from "./component";
import { compose, graphql } from "react-apollo";
import {
  unSavedEntriesSavedExperiencesGql,
  unSavedExperiencesGql,
  UPLOAD_UNSAVED_MUTATION
} from "../../state/sync-unsaved-resolver";
import { OwnProps } from "./utils";

const uploadUnsavedGql = graphql<OwnProps>(UPLOAD_UNSAVED_MUTATION);

export const Sync = compose(
  unSavedEntriesSavedExperiencesGql,
  unSavedExperiencesGql,
  uploadUnsavedGql
)(Comp);

export default Sync;
