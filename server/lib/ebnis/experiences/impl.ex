defmodule Ebnis.Experiences.Impl do
  alias Ebnis.Experiences.DefaultImpl.Experience

  @callback create_exp(map) :: {:ok, Experience.t()} | {:error, term, map}

  @callback get_exp(
              id :: binary(),
              user_id :: binary() | Integer.t()
            ) :: nil | Experience.t()

  @callback get_exps(user_id :: binary() | Integer.t()) :: [Experience.t()]
end
