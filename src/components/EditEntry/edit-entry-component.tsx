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
  DefinitionStateValue,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import makeClassNames from "classnames";
import { UpdateDefinitions_updateDefinitions } from "../../graphql/apollo-types/UpdateDefinitions";
import { editEntryUpdate } from "./edit-entry.update";

export function EditEntry(props: Props) {
  const {
    definitions,
    updateDefinitionsOnline,
    dispatch: parentDispatch,
    entry,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, initialStateFromProps);

  const [definitionsIds, defaultDefinitionsMap] = useMemo(() => {
    const objectsMap = (entry.dataObjects as DataObjectFragment[]).reduce(
      (acc, dataObject) => {
        acc[dataObject.definitionId] = dataObject;
        return acc;
      },
      {} as { [k: string]: DataObjectFragment },
    );

    const [ids, definitionsMap] = definitions.reduce(
      ([ids, map], definition) => {
        ids.push(definition.id);
        map[definition.id] = {
          definition,
          dataObject: objectsMap[definition.id],
        };

        return [ids, map];
      },
      [[], {}] as [string[], DefaultDefinitionsMap],
    );

    return [ids, definitionsMap];
  }, [definitions]);

  return (
    <Modal
      id="edit-entry-modal"
      open={true}
      closeIcon={true}
      onClose={() => {
        parentDispatch({
          type: ActionTypes.DESTROYED,
        });
      }}
      dimmer="inverted"
      closeOnDimmerClick={false}
    >
      <Modal.Header>Edit Entry</Modal.Header>
      {state.state === "submitting" && (
        <span id="edit-entry-submitting">Submitting</span>
      )}

      <Form>
        <DefinitionsContextProvider
          value={{
            dispatch,
            defaultDefinitionsMap,
            updateDefinitionsOnline,
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
    </Modal>
  );
}

interface DefinitionComponentProps {
  stateContext: DefinitionState;
  id: string;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, stateContext } = props;
  const { state, formValue } = stateContext;
  const stateValue = state as DefinitionStateValue;
  const {
    dispatch,
    defaultDefinitionsMap,
    updateDefinitionsOnline,
  } = useContext(DefinitionsContext);

  const idPrefix = `edit-entry-definition-${id}`;
  const {
    definition: { type, name: defaultFormValue },
  } = defaultDefinitionsMap[id];
  const typeText = `[${type}]`;

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        success: !!(stateValue.idle && stateValue.idle.success),
      })}
    >
      {stateValue.idle && (
        <div>
          <span>{typeText}</span>

          <span id={`${idPrefix}-name`}>{defaultFormValue}</span>

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
        </div>
      )}
      {!stateValue.idle && (
        <div>
          <label htmlFor={`${idPrefix}-input`}>{typeText}</label>

          <Input
            id={`${idPrefix}-input`}
            name={`${idPrefix}-input`}
            defaultValue={defaultFormValue}
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
        </div>
      )}
      {stateValue.pristine && (
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
      {stateValue.dirty && (
        <Button
          type="submit"
          id={`${idPrefix}-submit`}
          onClick={async () => {
            dispatch({
              type: ActionTypes.TITLE_EDIT_SUBMIT,
            });

            const result = await updateDefinitionsOnline({
              variables: {
                input: [
                  {
                    id,
                    name: formValue,
                  },
                ],
              },
              update: editEntryUpdate,
            });

            const data = (result &&
              result.data &&
              result.data
                .updateDefinitions) as UpdateDefinitions_updateDefinitions;

            dispatch({
              type: ActionTypes.submissionResult,
              ...data,
            });
          }}
        >
          Submit
        </Button>
      )}
    </Form.Field>
  );
}
