import { ApolloError } from "apollo-client";

export function parseStringError(error: string | Error): string {
  if (error instanceof ApolloError) {
    const { graphQLErrors, networkError } = error;
    return networkError ? networkError.message : graphQLErrors[0].message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return error;
  }
}

export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const FORM_CONTAINS_ERRORS_MESSAGE =
  "Form contains errors. Please correct them and save again.";

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

export const NOTHING_TO_SAVE_WARNING_MESSAGE =
  "Please make changes before saving.";

export interface CommonErrorPayload {
  error: CommonError;
}

export type CommonError = Error | string;

type ErrorField = string;
type ErrorText = string;
export type FieldError = [ErrorField, ErrorText][];
