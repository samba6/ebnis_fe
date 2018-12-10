import React, { lazy, Suspense, useState, useEffect, useContext } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import "./app.scss";
import { persistCache } from "../AppContext/set-up";
import logger from "../../logger";
import AuthRequired from "../../components/AuthRequired";
import {
  ROOT_URL,
  LOGIN_URL,
  SIGN_UP_URL,
  NEW_EXP_URL,
  EXP_URL,
  NEW_ENTRY_URL
} from "../../Routing";
import Loading from "../../components/Loading";
import Sidebar from "../../components/Sidebar";
import { AppContext } from "../AppContext/app-context";

const Home = lazy(() => import("../../routes/Home"));
const Login = lazy(() => import("../../routes/Login"));
const SignUp = lazy(() => import("../../routes/SignUp"));
const NewExp = lazy(() => import("../../routes/NewExp"));
const Exp = lazy(() => import("../../routes/Exp"));
const NewEntry = lazy(() => import("../../routes/NewEntry"));

const loading = <Loading />;

export function App() {
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const { header, client } = useContext(AppContext);

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

  return (
    <div className="containers-app">
      <ApolloProvider client={client}>
        {header}

        <BrowserRouter>
          <Suspense fallback={loading}>
            <Sidebar />

            {cacheLoaded ? (
              <Switch>
                <AuthRequired exact={true} path={EXP_URL} component={Exp} />

                <AuthRequired
                  exact={true}
                  path={NEW_ENTRY_URL}
                  component={NewEntry}
                />

                <AuthRequired
                  exact={true}
                  path={NEW_EXP_URL}
                  component={NewExp}
                />

                <AuthRequired exact={true} path={ROOT_URL} component={Home} />

                <Route
                  exact={true}
                  path={LOGIN_URL}
                  render={renderProps => <Login {...renderProps} />}
                />

                <Route
                  exact={true}
                  path={SIGN_UP_URL}
                  render={renderProps => <SignUp {...renderProps} />}
                />

                <Route render={renderProps => <Login {...renderProps} />} />
              </Switch>
            ) : (
              <Loading />
            )}
          </Suspense>
        </BrowserRouter>
      </ApolloProvider>
    </div>
  );
}

export default App;
