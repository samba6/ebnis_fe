import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { getToken } from "./tokens";

export type MakeSocketLinkFn = (arg: {
  token: string | null;
  forceReconnect?: boolean;
}) => ApolloLink;

export function middlewareAuthLink(makeSocketLink: MakeSocketLinkFn) {
  let previousToken = getToken();
  let socketLink = makeSocketLink({ token: previousToken });
  const headers: { [k: string]: string } = {};

  return new ApolloLink((operation, forward) => {
    const token = getToken();

    if (token !== previousToken) {
      previousToken = token;
      socketLink = makeSocketLink({ token, forceReconnect: true });
    }

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    operation.setContext({
      headers,
    });

    return socketLink.request(operation, forward);
  });
}

export function middlewareLoggerLink(link: ApolloLink) {
  if (process.env.NODE_ENV === "production" || process.env.NO_LOG) {
    return link;
  }

  return new ApolloLink((operation, forward) => {
    const operationName = `Apollo operation: ${operation.operationName}`;

    // tslint:disable-next-line:no-console
    console.log(
      "\n\n\n",
      getNow(),
      `\n====${operationName}===\n\n`,
      {
        query: operation.query.loc ? operation.query.loc.source.body : "",
        variables: operation.variables,
      },
      `\n\n===End ${operationName}====`,
    );

    if (!forward) {
      return null;
    }

    const fop = forward(operation);

    if (fop.map) {
      return fop.map(response => {
        // tslint:disable-next-line:no-console
        console.log(
          "\n\n\n",
          getNow(),
          `\n=Received response from ${operationName}=\n\n`,
          response,
          `\n\n=End Received response from ${operationName}=`,
        );
        return response;
      });
    }

    return fop;
  }).concat(link);
}

export function middlewareErrorLink(link: ApolloLink) {
  if (process.env.NODE_ENV === "production" || process.env.NO_LOG) {
    return link;
  }

  return onError(({ graphQLErrors, networkError, response, operation }) => {
    const logError = (errorName: string, obj: object) => {
      const operationName = `Response [${errorName} error] from Apollo operation: ${operation.operationName}`;

      // tslint:disable-next-line:no-console
      console.error(
        "\n\n\n",
        getNow(),
        `\n=${operationName}=\n\n`,
        obj,
        `\n\n=End Response ${operationName}=`,
      );
    };

    if (graphQLErrors) {
      logError("graphQLErrors", graphQLErrors);
    }

    if (response) {
      logError("", response);
    }

    if (networkError) {
      logError("Network Error", networkError);
    }
  }).concat(link);
}

function getNow() {
  const n = new Date();
  return `${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}:${n.getMilliseconds()}`;
}
