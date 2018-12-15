import React, { useState } from "react";
import { FieldProps } from "formik";
import { Form, Input, Icon } from "semantic-ui-react";

export default function PwdInput<TFormValues>(props: FieldProps<TFormValues>) {
  const { field } = props;
  const [pwdType, setPwdType] = useState("password");
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
            onClick={() => setPwdType("text")}
          />
        )}

        {pwdType === "text" && field.value && (
          <Icon
            name="eye slash"
            className="link"
            data-testid="password-mask"
            onClick={() => setPwdType("password")}
          />
        )}
      </Input>
    </Form.Field>
  );
}

export function makeId(name: string) {
  return `pwd-input-${name}`;
}
