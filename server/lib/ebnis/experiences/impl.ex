defmodule Ebnis.Experiences.Impl do
  alias Ebnis.Experiences.Experience

  @callback create_experience(map) ::
    {:ok, Experience.t()} | {:error, term, map}
end
