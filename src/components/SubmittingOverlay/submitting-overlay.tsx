import React from "react";
import { createPortal } from "react-dom";
import Dimmer from "semantic-ui-react/dist/commonjs/modules/Dimmer";
import { Loading } from "../Loading/loading";

export function SubmittingOverlay() {
  return createPortal(
    <Dimmer.Dimmable
      id="submitting-overlay"
      dimmed={true}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    >
      <Dimmer active={true} inverted={true}>
        <Loading loading={true} />
      </Dimmer>
    </Dimmer.Dimmable>,

    document.body,
  );
}
