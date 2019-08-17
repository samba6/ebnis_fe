/* eslint-disable @typescript-eslint/no-explicit-any */
import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading";

export const NewEntry = Loadable({
  loader: () => import("../NewEntry/new-entry"),
  loading: LoadableLoading,
}) as any;

export const ExperienceRoute = Loadable({
  loader: () => import("../ExperienceRoute/experience-route"),
  loading: LoadableLoading,
}) as any;
