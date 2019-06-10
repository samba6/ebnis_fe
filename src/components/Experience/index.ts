import { compose, withApollo } from "react-apollo";

import { Experience as Comp } from "./component";
import { OwnProps } from "./utils";

import { resolvers } from "./resolvers";
import { getExperienceGql } from "./get-experience-gql";
import { getUnsavedExperienceGql } from "./get-unsaved-experience-gql";

// tslint:disable-next-line: prefer-const
let resolverAdded = false;

export const Experience = compose(
  withApollo,
  getUnsavedExperienceGql<OwnProps>(),
  getExperienceGql<OwnProps>(resolvers, resolverAdded)
)(Comp);
