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
      fields_multi(fields, id)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{experience: experience}} ->
        {:ok, to_domain(experience)}

      {:error, failed_operations, changeset, _successes} ->
        {:error, failed_operations, changeset}
    end
  end

  defp fields_multi(fields, experience_id) do
    fields
    |> Enum.with_index()
    |> Enum.reduce(
      Multi.new(),
      fn {field, index}, acc ->
        Multi.run(acc, "#{field.name}---#{index}", fn _repo, _changes ->
          Field.changeset(
            %Field{},
            Map.put(field, :experience_id, experience_id)
          )
          |> Repo.insert()
        end)
      end
    )
  end

  def get_experience(id, user_id) do
    Experience
    |> where([e], e.id == ^id and e.user_id == ^user_id)
    |> Repo.one()
    |> to_domain()
  end

  defp to_domain(%Experience{} = experience) do
    struct(
      Ebnis.Experiences.DefaultImpl.Experience,
      Map.from_struct(experience)
    )
  end

  defp to_domain(data), do: data
end
