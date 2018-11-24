import { graphql, compose } from "react-apollo";

import Login from "./route";
import { userLocalMutationGql } from "../../state/user.local.mutation";
import USER_LOCAL_QUERY, {
  LoggedOutUserData,
  LoggedOutUserProps
} from "../../state/logged-out-user.local.query";

const loggedOutUserGql = graphql<
  {},
  LoggedOutUserData,
  {},
  LoggedOutUserProps | undefined
>(USER_LOCAL_QUERY, {
  props: props => props.data
});

export default compose(
  loggedOutUserGql,
  userLocalMutationGql
)(Login);
