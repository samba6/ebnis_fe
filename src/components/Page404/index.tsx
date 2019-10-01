import React from "react";
import { Link } from "../Link";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { ROOT_URL } from "../../routes";
import { RouteComponentProps } from "@reach/router";
import { HeaderSemantic } from "../Header/header-semantic.component";

export function Page404({  }: RouteComponentProps) {
  return (
    <>
      <HeaderSemantic title="Page Not Found" />

      <div
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1>You are here at #404!</h1>
        <h3>But this is not where you are going!</h3>

        <Button as={Link} to={ROOT_URL} color="green">
          <span
            style={{
              fontWeight: 900,
              fontSize: "2rem",
            }}
          >
            &larr;
          </span>
          Get back home
        </Button>
      </div>
    </>
  );
}
