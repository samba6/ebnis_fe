import React from "react";
import { Props, PasswordInputType } from "./utils";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";

export const PasswordInput = React.memo(
  function PwdInputComponent<TFormValues>(props: Props<TFormValues>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { field, pwdType = "password", dispatch, form, ...rest } = props;
    const id = makeId(field.name);

    return (
      <Form.Field>
        <label htmlFor={rest.id || id}>Password</label>

        <Input icon={true}>
          <input
            {...field}
            type={pwdType}
            autoComplete="off"
            id={id}
            {...rest}
          />

          {pwdType === "password" && field.value && (
            <Icon
              name="eye"
              className="link"
              id="password-unmask"
              onClick={() => dispatch([PasswordInputType, "text"])}
            />
          )}

          {pwdType === "text" && field.value && (
            <Icon
              name="eye slash"
              className="link"
              id="password-mask"
              onClick={() => dispatch([PasswordInputType, "password"])}
            />
          )}
        </Input>
      </Form.Field>
    );
  },

  function PwdInputDiff(p, n) {
    if (p.pwdType !== n.pwdType) {
      return false;
    }

    if (p.field.value !== n.field.value) {
      return false;
    }

    return true;
  },
);

export function makeId(name: string) {
  return `pwd-input-${name}`;
}
