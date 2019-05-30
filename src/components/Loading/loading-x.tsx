import React from "react";
import { Dimmer, Loader, Segment } from "semantic-ui-react";

export const Loading = () => (
  <Dimmer.Dimmable as={Segment} dimmed={true} style={{ margin: 0, flex: 1 }}>
    <Dimmer active={true} inverted={true}>
      <Loader data-testid="loading-spinner" />
    </Dimmer>
  </Dimmer.Dimmable>
);

export default Loading;
