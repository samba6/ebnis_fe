/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LogoImageQuery
// ====================================================

export interface LogoImageQuery_file_childImageSharp_fixed {
  __typename: "ImageSharpFixed";
  src: string | null;
  width: number | null;
  height: number | null;
}

export interface LogoImageQuery_file_childImageSharp {
  __typename: "ImageSharp";
  fixed: LogoImageQuery_file_childImageSharp_fixed | null;
}

export interface LogoImageQuery_file {
  __typename: "File";
  childImageSharp: LogoImageQuery_file_childImageSharp | null;
}

export interface LogoImageQuery {
  file: LogoImageQuery_file | null;
}
