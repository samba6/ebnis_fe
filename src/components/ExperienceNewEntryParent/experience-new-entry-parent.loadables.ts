/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading/loading";

export const NewEntry = Loadable({
  loader: () => import("../NewEntry/new-entry.component"),
  loading: LoadableLoading,
}) as any;

export const ExperienceRoute = Loadable({
  loader: () => import("../ExperienceRoute/experience-route.component"),
  loading: LoadableLoading,
}) as any;
