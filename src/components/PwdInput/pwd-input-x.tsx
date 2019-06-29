import React from "react";
import { Props, PwdInputActionTypes } from "./pwd-input";
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
              onClick={() =>
                dispatch({
                  payload: "text",
                  type: PwdInputActionTypes.SET_PWD_TYPE,
                })
              }
            />
          )}

          {pwdType === "text" && field.value && (
            <Icon
              name="eye slash"
              className="link"
              data-testid="password-mask"
              onClick={() =>
                dispatch({
                  payload: "password",
                  type: PwdInputActionTypes.SET_PWD_TYPE,
                })
              }
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

export default PwdInput;

export function makeId(name: string) {
  return `pwd-input-${name}`;
}
