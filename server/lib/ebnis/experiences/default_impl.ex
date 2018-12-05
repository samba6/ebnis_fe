defmodule Ebnis.Experiences.DefaultImpl do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ecto.Multi
  alias Ebnis.Experiences.DefaultImpl.ExpDef
  alias Ebnis.Experiences.DefaultImpl.FieldDef

  @behaviour Ebnis.Experiences.Impl

  def create_exp_def(%{field_defs: field_defs} = attrs) do
    Multi.new()
    |> Multi.run(:exp_def, fn _repo, _ ->
      %ExpDef{}
      |> ExpDef.changeset(Map.delete(attrs, :field_defs))
      |> Repo.insert()
    end)
    |> Multi.merge(fn %{exp_def: %ExpDef{id: id}} ->
      field_defs_multi(field_defs, id)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{exp_def: exp_def}} ->
        {:ok, to_domain(exp_def)}

      {:error, failed_operations, changeset, _successes} ->
        {:error, failed_operations, changeset}
    end
  end

  defp field_defs_multi(field_defs, exp_def_id) do
    field_defs
    |> Enum.with_index()
    |> Enum.reduce(
      Multi.new(),
      fn {field, index}, acc ->
        Multi.run(acc, "#{field.name}---#{index}", fn _repo, _changes ->
          FieldDef.changeset(
            %FieldDef{},
            Map.put(field, :exp_def_id, exp_def_id)
          )
          |> Repo.insert()
        end)
      end
    )
  end

  def get_exp_def(id, user_id) do
    ExpDef
    |> where([e], e.id == ^id and e.user_id == ^user_id)
    |> Repo.one()
    |> to_domain()
  end

  # defp to_domain(%ExpDef{} = experience) do
  #   struct(
  #     Ebnis.Experiences.DefaultImpl.ExpDef,
  #     Map.from_struct(experience)
  #   )
  # end

  defp to_domain(data), do: data
end
