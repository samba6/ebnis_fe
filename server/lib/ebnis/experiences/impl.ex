defmodule Ebnis.Experiences.Impl do
  alias Ebnis.Experiences.DefaultImpl.Experience
  alias Ebnis.Experiences.DefaultImpl.Entry

  @callback create_exp(map) :: {:ok, Experience.t()} | {:error, term, map}

  @callback get_exp(
              id :: binary(),
              user_id :: binary() | Integer.t()
            ) :: nil | Experience.t()

  @callback get_exps(user_id :: binary() | Integer.t()) :: [Experience.t()]

  @callback create_entry(map) :: {:ok, Entry.t()} | {:error, term, map}

  @callback get_exp_entries(
              exp_id :: binary() | Integer.t(),
              user_id :: binary() | Integer.t()
            ) :: [Entry.t()]
end
