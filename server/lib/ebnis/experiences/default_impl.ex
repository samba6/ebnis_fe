defmodule Ebnis.Experiences.DefaultImpl do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ecto.Multi
  alias Ebnis.Experiences.DefaultImpl.Experience
  alias Ebnis.Experiences.DefaultImpl.Field

  @behaviour Ebnis.Experiences.Impl

  def create_experience(%{fields: fields} = attrs) do
    Multi.new()
    |> Multi.run(:experience, fn _repo, _ ->
      %Experience{}
      |> Experience.changeset(Map.delete(attrs, :fields))
      |> Repo.insert()
    end)
    |> Multi.merge(fn %{experience: %Experience{id: id}} ->
      fields = Enum.map(fields, &Map.put(&1, :experience_id, id))

      Multi.insert_all(Multi.new(), :fields, Field, fields)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{experience: experience}} ->
        {:ok, to_domain(experience)}

      {:error, failed_operations, changeset, _successes} ->
        {:error, failed_operations, changeset}
    end
  end

  defp to_domain(%Experience{} = experience) do
    struct(
      Ebnis.Experiences.DefaultImpl.Experience,
      Map.from_struct(experience)
    )
  end
end
