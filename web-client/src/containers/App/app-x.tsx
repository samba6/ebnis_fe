import React, { lazy, Suspense, useState, useEffect } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import "./app.scss";
import Header from "../../components/Header";
import { makeClient, persistCache } from "../../state/set-up";
import logger from "../../logger";
import AuthRequired from "../../components/AuthRequired";
import {
  ROOT_URL,
  LOGIN_URL,
  SIGN_UP_URL,
  NEW_EXP_URL,
  EXP_URL
} from "../../Routing";
import Loading from "../../components/Loading";
import Sidebar from "../../components/Sidebar";
import { getSocket } from "../../socket";
import { AppRouteProps } from "./app";
import { AppContextParent } from "./app-context";

const Home = lazy(() => import("../../routes/Home"));
const Login = lazy(() => import("../../routes/Login"));
const SignUp = lazy(() => import("../../routes/SignUp"));
const NewExp = lazy(() => import("../../routes/NewExp"));
const Exp = lazy(() => import("../../routes/Exp"));

let client = makeClient();
const loading = <Loading />;

function reInitSocket(jwt: string) {
  const socket = getSocket().ebnisConnect(jwt);
  client = makeClient(socket, true);
}

export function App() {
  const [header, setHeader] = useState(<Header title="Ebnis" />);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    (async function() {
      try {
        await persistCache();
        setCacheLoaded(true);
      } catch (error) {
        logger("error", "Error restoring Apollo cache", error);
      }
    })();
  }, []);

  const childProps: AppRouteProps = {
    setHeader,
    reInitSocket
  };

  return (
    <div className="containers-app">
      <ApolloProvider client={client}>
        <AppContextParent>
          {header}

          <BrowserRouter>
            <Suspense fallback={loading}>
              <Sidebar />

              {cacheLoaded ? (
                <Switch>
                  <AuthRequired
                    exact={true}
                    path={EXP_URL}
                    component={Exp}
                    redirectTo={Login}
                    {...childProps}
                  />

                  <AuthRequired
                    exact={true}
                    path={NEW_EXP_URL}
                    component={NewExp}
                    redirectTo={Login}
                    {...childProps}
                  />

                  <AuthRequired
                    exact={true}
                    path={ROOT_URL}
                    component={Home}
                    redirectTo={Login}
                    {...childProps}
                  />

                  <Route
                    exact={true}
                    path={LOGIN_URL}
                    render={renderProps => (
                      <Login {...childProps} {...renderProps} />
                    )}
                  />

                  <Route
                    exact={true}
                    path={SIGN_UP_URL}
                    render={renderProps => (
                      <SignUp {...childProps} {...renderProps} />
                    )}
                  />

                  <Route
                    render={renderProps => (
                      <Login {...childProps} {...renderProps} />
                    )}
                  />
                </Switch>
              ) : (
                <Loading />
              )}
            </Suspense>
          </BrowserRouter>
        </AppContextParent>
      </ApolloProvider>
    </div>
  );
}

export default App;
