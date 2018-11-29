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
      Enum.reduce(
        fields,
        Multi.new(),
        fn field, acc ->
          Multi.run(acc, field.name, fn _repo, _changes ->
            Field.changeset(%Field{}, Map.put(field, :experience_id, id))
            |> Repo.insert()
          end)
        end
      )
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
