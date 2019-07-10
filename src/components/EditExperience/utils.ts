import { ExperienceNoEntryFragment } from "../../graphql/apollo-types/ExperienceNoEntryFragment";
import { UpdateExperienceMutationFn } from "../../graphql/update-experience.mutation";
import { Dispatch } from "react";
import { UpdateExperienceMutation_updateExperience } from "../../graphql/apollo-types/UpdateExperienceMutation";

export enum EditExperienceActionType {
  editCancelled = "@components/edit-experience-modal/edit-cancelled",
  editFinished = "@components/edit-experience-modal/edit-finished",
  ready = "ready",
  submitting = "submitting",
  formError = "form-error",
  genericServerError = "generic-server-error",
  successful = "successful",
  experienceError = "experience-error",
  fieldDefinitionsErrors = "field-definitions-errors",
}

export interface Props {
  experience: ExperienceNoEntryFragment;
  onEdit: UpdateExperienceMutationFn;
  dispatch: Dispatch<EditExperienceAction>;
}

export type EditExperienceAction =
  | [EditExperienceActionType.editCancelled]
  | [EditExperienceActionType.editFinished];

export type EditingState =
  | [EditExperienceActionType.ready]
  | [EditExperienceActionType.submitting]
  | [EditExperienceActionType.formError]
  | [EditExperienceActionType.genericServerError, string]
  | [EditExperienceActionType.experienceError, UpdateErrors];

export interface UpdateErrors {
  experienceError: UpdateExperienceMutation_updateExperience["experienceError"];
  fieldDefinitionsErrors: UpdateExperienceMutation_updateExperience["fieldDefinitionsErrors"];
}
