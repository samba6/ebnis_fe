import Loadable from "react-loadable";
import { LoadableLoading } from "../Loading";

export const NewEntry = Loadable({
  loader: () => import("../NewEntry"),
  loading: LoadableLoading
  // tslint:disable-next-line: no-any
}) as any;

export const Experience = Loadable({
  loader: () => import("../Experience"),
  loading: LoadableLoading
  // tslint:disable-next-line: no-any
}) as any;
