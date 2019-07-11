/* eslint-disable @typescript-eslint/no-explicit-any */
import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading";

export const EditEntry = Loadable({
  loader: () => import("../EditEntry"),
  loading: LoadableLoading,
}) as any;

export const EditExperience = Loadable({
  loader: () => import("../EditExperience"),
  loading: LoadableLoading,
}) as any;
