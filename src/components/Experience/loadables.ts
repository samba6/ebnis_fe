/* eslint-disable @typescript-eslint/no-explicit-any */
import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading/loading";

export const EditExperience = Loadable({
  loader: () => import("../EditExperience/edit-experience.component"),
  loading: LoadableLoading,
});
