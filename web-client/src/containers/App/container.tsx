import React, { lazy, Suspense } from "react";
import { ApolloProvider } from "react-apollo";
import update from "immutability-helper";

import "./app.scss";
import Header from "../../components/Header";
import {
  Route,
  State,
  initialMediaQueries,
  RoutingProps,
  MediaQueryKey,
  mediaQueries,
  defaultRt,
  setTitle
} from "./app";
import { client, persistCache } from "../../state/set-up";
import logger from "../../logger";
import { RouterThings as HomeRt } from "../../routes/Home/home";
import { RouterThings as LoginRt } from "../../routes/Login/login";
import { RouterThings as SignUpRt } from "../../routes/SignUp/sign-up";

const routes = {
  [Route.LOGIN]: {
    component: lazy(() => import("./../../routes/Login")),
    rt: LoginRt
  },
  [Route.HOME]: {
    component: lazy(() => import("./../../routes/Home")),
    rt: HomeRt
  },
  [Route.SIGN_UP]: {
    component: lazy(() => import("./../../routes/SignUp")),
    rt: SignUpRt
  }
};

const Loading = () => <div>Loading</div>;

const defaultHeader = <Header title="Ebnis" />;

export class App extends React.Component<{}, State> {
  state: State = {
    router: routes[Route.HOME],
    mediaQueries: initialMediaQueries
  };

  mediaListeners: Array<() => void> = [];

  async componentDidMount() {
    try {
      await persistCache();
    } catch (error) {
      logger("error", "Error restoring Apollo cache", error);
    }

    this.setState({ cacheLoaded: true });
    this.setUpMediaListeners();
  }

  componentWillUnmount() {
    this.tearDownMediaListeners();
  }

  render() {
    const { router, header = defaultHeader } = this.state;
    const { routeTo, setHeader } = this;
    let Component;
    let documentTitle;

    if (router) {
      Component = router.component;
      documentTitle = router.rt.documentTitle;
    } else {
      Component = routes[Route.HOME].component;
      documentTitle = defaultRt.documentTitle;
    }

    setTitle(documentTitle);

    return (
      <div className="containers-app">
        <ApolloProvider client={client}>
          {header}
          <Suspense fallback={<Loading />}>
            <Component
              className="app-main"
              routeTo={routeTo}
              client={client}
              setHeader={setHeader}
            />
          </Suspense>
        </ApolloProvider>
      </div>
    );
  }

  private routeTo = (props: RoutingProps) => {
    const { name } = props;
    this.setState({ router: routes[name] });
  };

  private setHeader = (header: React.ComponentClass) =>
    this.setState({ header });

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
}

export default App;
