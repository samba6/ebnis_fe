defmodule Ebnis.Experiences.Impl do
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  @callback create_exp_def(map) :: {:ok, ExpDef.t()} | {:error, term, map}

  @callback get_exp_def(
              id :: binary(),
              user_id :: binary() | Integer.t()
            ) :: nil | ExpDef.t()

  @callback get_exp_defs(user_id :: binary() | Integer.t()) ::  [ExpDef.t()]
end
