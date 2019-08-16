import React, { useMemo, useReducer, useContext } from "react";
import {
  Props,
  ActionTypes,
  initialStateFromProps,
  reducer,
  DefinitionState,
  DefaultDefinitionsMap,
  DefinitionsContextProvider,
  DefinitionsContext,
} from "./utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";

export function EditEntry(props: Props) {
  const { definitions } = props;

  const [state, dispatch] = useReducer(reducer, props, initialStateFromProps);

  const [definitionsIds, defaultDefinitionsMap] = useMemo(() => {
    return definitions.reduce(
      ([ids, map], definition) => {
        ids.push(definition.id);
        map[definition.id] = definition;

        return [ids, map];
      },
      [[], {}] as [string[], DefaultDefinitionsMap],
    );
  }, [definitions]);

  return (
    <>
      {state.state === "submitting" && (
        <span id="edit-entry-submitting">Submitting</span>
      )}

      <Form>
        <DefinitionsContextProvider
          value={{
            dispatch,
            defaultDefinitionsMap,
          }}
        >
          {definitionsIds.map(id => {
            return (
              <DefinitionComponent
                key={id}
                id={id}
                stateContext={state.definitionsStates[id]}
              />
            );
          })}
        </DefinitionsContextProvider>
      </Form>
    </>
  );
}

interface DefinitionComponentProps {
  stateContext: DefinitionState;
  id: string;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, stateContext } = props;
  const { state, formValue } = stateContext;
  const { dispatch, defaultDefinitionsMap } = useContext(DefinitionsContext);

  const idPrefix = `edit-entry-definition-${id}`;
  const { type, name: defaultFormValue } = defaultDefinitionsMap[id];

  return (
    <div id={idPrefix}>
      <Form.Field>
        {type}

        <>
          {state === "idle" && <span id={`${idPrefix}-name`}>{formValue}</span>}

          {(state === "pristine" || state === "dirty") && (
            <Input
              id={`${idPrefix}-input`}
              name={`${idPrefix}-input`}
              onChange={(_, { value }) => {
                if (value === defaultFormValue) {
                  dispatch({
                    type: ActionTypes.TITLE_RESET,
                    id,
                  });
                } else {
                  dispatch({
                    type: ActionTypes.TITLE_CHANGED,
                    id,
                    formValue: value,
                  });
                }
              }}
            />
          )}
        </>

        {state === "idle" && (
          <Button
            type="button"
            id={`${idPrefix}-edit-btn`}
            onClick={() =>
              dispatch({
                type: ActionTypes.EDIT_BTN_CLICKED,
                id,
              })
            }
          >
            Edit
          </Button>
        )}

        {state === "pristine" && (
          <Button
            type="button"
            id={`${idPrefix}-dismiss`}
            onClick={() => {
              dispatch({
                type: ActionTypes.TITLE_EDIT_DISMISS,
                id,
              });
            }}
          >
            Dismiss
          </Button>
        )}

        {state === "dirty" && (
          <Button
            type="submit"
            id={`${idPrefix}-submit`}
            onClick={() => {
              dispatch({
                type: ActionTypes.TITLE_EDIT_SUBMIT,
              });
            }}
          >
            Submit
          </Button>
        )}
      </Form.Field>
    </div>
  );
}
