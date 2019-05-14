// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import { Experience } from "../components/Experience/component";
import { Props } from "../components/Experience/utils";

type P = ComponentType<Partial<Props>>;
const ExperienceP = Experience as P;

it("renders ", () => {
  const { ui } = makeComp();
  const {} = render(ui);
});

function makeComp(props: Partial<Props> = {}) {
  return {
    ui: (
      <ExperienceP
        getExperienceGql={{ exp: {} } as any}
        {...props}
        SidebarHeader={jest.fn(() => null)}
      />
    )
  };
}
