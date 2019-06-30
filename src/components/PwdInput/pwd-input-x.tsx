import React from "react";
import { Props, PasswordInputType } from "./pwd-input";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";

export const PwdInput = React.memo(
  function PwdInputComponent<TFormValues>(props: Props<TFormValues>) {
    const { field, pwdType = "password", dispatch } = props;
    const id = makeId(field.name);

    return (
      <Form.Field>
        <label htmlFor={id}>Password</label>

        <Input icon={true} placeholder="" data-testid={id}>
          <input {...field} type={pwdType} autoComplete="off" id={id} />

          {pwdType === "password" && field.value && (
            <Icon
              name="eye"
              className="link"
              data-testid="password-unmask"
              onClick={() => dispatch([PasswordInputType, "text"])}
            />
          )}

          {pwdType === "text" && field.value && (
            <Icon
              name="eye slash"
              className="link"
              data-testid="password-mask"
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
