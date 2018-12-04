defmodule Ebnis.Experiences.Impl do
  alias Ebnis.Experiences.Experience

  @callback create_experience(map) :: {:ok, Experience.t()} | {:error, term, map}

  @callback get_experience(
              exp_id :: binary(),
              user_id :: binary() | Integer.t()
            ) :: nil | Experience.t()
end
