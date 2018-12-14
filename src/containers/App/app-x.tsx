import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import "./app.scss";
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
import Header from "../../components/Header";

const Home = lazy(() => import("../../routes/Home"));
const Login = lazy(() => import("../../routes/Login"));
const SignUp = lazy(() => import("../../routes/SignUp"));
const NewExp = lazy(() => import("../../routes/NewExp"));
const Exp = lazy(() => import("../../routes/Exp"));
const NewEntry = lazy(() => import("../../routes/NewEntry"));

function Root() {
  return (
    <div className="app-container">
      <div className="app-main">
        <Header title="" />
        <Loading />
      </div>
    </div>
  );
}

export function App(props: { persistCache: () => void }) {
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const { persistCache } = props;

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
    <BrowserRouter>
      <Suspense fallback={<Root />}>
        {cacheLoaded ? (
          <Switch>
            <AuthRequired exact={true} path={EXP_URL} component={Exp} />

            <AuthRequired
              exact={true}
              path={NEW_ENTRY_URL}
              component={NewEntry}
            />

            <AuthRequired exact={true} path={NEW_EXP_URL} component={NewExp} />

            <AuthRequired exact={true} path={ROOT_URL} component={Home} />

            <Route
              exact={true}
              path={LOGIN_URL}
              render={function renderLogin(childProps) {
                return <Login {...childProps} />;
              }}
            />

            {/* we are using render props because react router 4 is not yet
              compatible with react > 16.7. React router throws invalid props
              error (only in dev) for component prop, but otherwise it
              renders ok
           */}
            <Route
              exact={true}
              path={SIGN_UP_URL}
              render={function renderSignUp(childProps) {
                return <SignUp {...childProps} />;
              }}
            />

            <Route
              render={function renderLogin(childProps) {
                return <Login {...childProps} />;
              }}
            />
          </Switch>
        ) : (
          <Root />
        )}
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
