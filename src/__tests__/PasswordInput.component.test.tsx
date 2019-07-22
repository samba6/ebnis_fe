/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useReducer, Reducer } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";
import { Formik, Field, FieldProps } from "formik";

import { PwdInput } from "../components/PwdInput/pwd-input-x";
import { Props } from "../components/PwdInput/pwd-input";
import { makeId } from "../components/PwdInput/pwd-input-x";
import {
  PasswordInputAction,
  PasswordInputPayload,
} from "../components/PwdInput/pwd-input";

const reducer: Reducer<
  PasswordInputPayload | undefined,
  PasswordInputAction
> = (prevState, [, payload]) => {
  return payload;
};

const name = "pwd";
const id = makeId(name);

it("renders correctly", () => {
  render(<App />);

  expect(document.getElementById("password-unmask")).toBeNull();

  expect(document.getElementById("password-mask")).toBeNull();

  const $pwd = document.getElementById(id) as HTMLInputElement;
  const pwd = "awesome pass";

  fireEvent.change($pwd, {
    target: { value: pwd },
  });

  expect(document.getElementById("password-unmask")).not.toBeNull();

  fireEvent.change($pwd, {
    target: { value: "" },
  });

  expect(document.getElementById("password-unmask")).toBeNull();

  fireEvent.change($pwd, {
    target: { value: pwd },
  });

  fireEvent.click(document.getElementById("password-unmask") as any);
  expect(document.getElementById("password-unmask")).toBeNull();

  fireEvent.click(document.getElementById("password-mask") as any);

  expect(document.getElementById("password-mask")).toBeNull();

  expect(document.getElementById("password-unmask")).not.toBeNull();
});

it("uses custom id", () => {
  render(<App id="1" />);

  expect(document.getElementById("1")).not.toBeNull();
  expect(document.getElementById(id)).toBeNull();
});

//////////////////////////  ////////////////////////////

function App(props: Partial<Props<{}>> = {}) {
  const [state, dispatch] = useReducer(reducer, undefined);

  return (
    <Formik
      onSubmit={() => null}
      initialValues={{ [name]: "" }}
      validateOnChange={false}
      render={() => (
        <Field
          name={name}
          render={(fieldProps: FieldProps) => (
            <PwdInput
              {...fieldProps}
              dispatch={dispatch}
              pwdType={state}
              {...props}
            />
          )}
        />
      )}
    />
  );
}
