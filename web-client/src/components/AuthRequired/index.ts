import { graphql, compose } from "react-apollo";

import AuthRequired from "./component";
import AUTH_USER_LOCAL_QUERY, {
  UserLocalGqlData,
  UserLocalGqlProps
} from "../../state/auth.local.query";

const authUserLocalGraphQl = graphql<
  {},
  UserLocalGqlData,
  {},
  UserLocalGqlProps | undefined
>(AUTH_USER_LOCAL_QUERY, {
  props: ({ data }) => {
    return data;
  }
});

export default compose(authUserLocalGraphQl)(AuthRequired);
