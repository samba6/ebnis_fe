import React, { lazy, Suspense } from "react";
import { ApolloProvider } from "react-apollo";
import update from "immutability-helper";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import "./app.scss";
import Header from "../../components/Header";
import {
  State,
  initialMediaQueries,
  MediaQueryKey,
  mediaQueries,
  AppContextProvider,
  AppContextProps
} from "./app";
import { client, persistCache } from "../../state/set-up";
import logger from "../../logger";
import AuthRequired from "../../components/AuthRequired";
import { ROOT_URL, LOGIN_URL, SIGN_UP_URL } from "../../Routing";
import Loading from "../../components/Loading";
import Sidebar from "../../components/Sidebar";

const Home = lazy(() => import("./../../routes/Home"));
const Login = lazy(() => import("./../../routes/Login"));
const SignUp = lazy(() => import("./../../routes/SignUp"));

const defaultHeader = <Header title="Ebnis" />;

export class App extends React.Component<{}, State> {
  state: State = {
    mediaQueries: initialMediaQueries
  };

  mediaListeners: Array<() => void> = [];

  componentDidMount() {
    this.persistCache();
    this.setUpMediaListeners();
  }

  componentWillUnmount() {
    this.tearDownMediaListeners();
  }

  render() {
    const { header = defaultHeader, showSidebar } = this.state;
    const { setHeader, onShowSidebar } = this;
    const childProps: AppContextProps = {
      onShowSidebar,
      setHeader,
      showSidebar
    };

    return (
      <div className="containers-app">
        <ApolloProvider client={client}>
          <AppContextProvider value={childProps}>
            <Sidebar />
            {header}
            <BrowserRouter>
              <Suspense fallback={<Loading />}>
                <Switch>
                  <AuthRequired
                    exact={true}
                    path={ROOT_URL}
                    component={Home}
                    redirectTo={Login}
                    {...childProps}
                  />

                  <Route
                    exact={true}
                    path={SIGN_UP_URL}
                    render={renderProps => (
                      <SignUp {...childProps} {...renderProps} />
                    )}
                  />

                  <Route
                    exact={true}
                    path={LOGIN_URL}
                    render={renderProps => (
                      <Login {...childProps} {...renderProps} />
                    )}
                  />

                  <Route
                    render={renderProps => (
                      <Login {...childProps} {...renderProps} />
                    )}
                  />
                </Switch>
              </Suspense>
            </BrowserRouter>
          </AppContextProvider>
        </ApolloProvider>
      </div>
    );
  }

  private setHeader = (header: JSX.Element) => {
    this.setState({ header });
  };

  private tearDownMediaListeners = () => this.mediaListeners.forEach(m => m());

  private setUpMediaListeners = () => {
    const queries = Object.values(mediaQueries);
    // tslint:disable-next-line:no-any
    const handleMediaQueryChange = this.handleMediaQueryChange as any;

    for (let index = 0; index < queries.length; index++) {
      const m = window.matchMedia(queries[index]) as MediaQueryList;
      m.addListener(handleMediaQueryChange);
      handleMediaQueryChange(m);
      this.mediaListeners[index] = () =>
        m.removeListener(handleMediaQueryChange);
    }
  };

  private handleMediaQueryChange = (
    mql: MediaQueryListEvent | MediaQueryList
  ) => {
    const { matches, media } = mql;
    const acc1 = {} as { [k in MediaQueryKey]: { $set: boolean } };

    const updates = Object.entries(mediaQueries).reduce((acc2, [k, v]) => {
      const isMatchedMedia = v === media;

      acc2[k] = { $set: isMatchedMedia ? matches : false };
      return acc2;
    }, acc1);

    this.setState(s =>
      update(s, {
        mediaQueries: updates
      })
    );
  };

  private persistCache = async () => {
    try {
      await persistCache();
    } catch (error) {
      logger("error", "Error restoring Apollo cache", error);
    }

    this.setState({ cacheLoaded: true });
  };

  private onShowSidebar = (showSidebar: boolean) =>
    this.setState({ showSidebar });
}

export default App;
