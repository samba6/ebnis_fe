defmodule Ebnis.Experiences.DefaultImpl.Entry do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Experiences.DefaultImpl.Experience
  alias Ebnis.Experiences.DefaultImpl.Field
  alias Ebnis.Experiences

  @moduledoc ~S"""
    For the changeset - when we are inserting an entry. The attribute expected
    is of the form:
      %{
        exp_id: :the_id_of_the_experience,
        user_id: :the_owner_of_the_experience,
        fields: [
          %{
            def_id: the_field_definition_id_from_field_def_child_of_experience,
            data: %{date: ~D[]} or %{:single_line_text: "some short text"}, etc
          }
        ]
      }
  """

  @timestamps_opts [type: :utc_datetime]
  schema "entries" do
    belongs_to(:exp, Experience)
    embeds_many(:fields, Field)

    timestamps()
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = schema, %{} = attrs) do
    schema
    |> cast(attrs, [:exp_id])
    |> cast_embed(:fields, required: true)
    |> validate_required([:exp_id, :fields])
    |> validate_fields(attrs.exp_id, attrs.user_id)
  end

  defp validate_fields(%Changeset{valid?: false} = changeset, _, _) do
    changeset
  end

  # In this function, we validate that
  # 1. the experience exists otherwise:
  # add error :exp_id, "does not exist", validation: :assoc
  # 2. that all field.def_id exist as field_def.id on the experience struct
  # otherwise: add error :def_id, "does not exist", validation: :assoc
  # 3. that every field.def_id is unique. Otherwise:
  # add error :def_id, "has already been taken", validation: :uniqueness
  defp validate_fields(
         %Changeset{changes: changes} = changeset,
         exp_id,
         user_id
       ) do
    case get_field_defs(exp_id, user_id) do
      {:error, nil} ->
        add_error(changeset, :exp_id, "does not exist", validation: :assoc)

      {db_def_ids, field_defs_id_type_map} ->
        {fields, _} =
          Enum.reduce(
            changes.fields,
            {[], []},
            fn entry_changeset, {acc, def_ids} ->
              def_id = entry_changeset.changes.def_id
              [data_type | _] = Map.keys(entry_changeset.changes.data)

              new_changeset =
                cond do
                  not Enum.member?(db_def_ids, def_id) ->
                    add_error(
                      entry_changeset,
                      :def_id,
                      "does not exist",
                      validation: :assoc
                    )

                  Enum.member?(def_ids, def_id) ->
                    add_error(
                      entry_changeset,
                      :def_id,
                      "has already been taken",
                      validation: :uniqueness
                    )

                  field_defs_id_type_map[def_id] != data_type ->
                    add_error(
                      entry_changeset,
                      :def_id,
                      "invalid data type"
                    )

                  true ->
                    entry_changeset
                end

              {[new_changeset | acc], [def_id | def_ids]}
            end
          )

        put_change(changeset, :fields, Enum.reverse(fields))
    end
  end

  defp get_field_defs(exp_id, user_id) do
    case Experiences.get_exp_field_defs(exp_id, user_id) do
      nil ->
        {:error, nil}

      field_defs ->
        db_def_ids = Enum.map(field_defs, & &1.id)

        field_defs_id_type_map =
          Enum.reduce(
            field_defs,
            %{},
            &Map.put(&2, &1.id, &1.type)
          )

        {db_def_ids, field_defs_id_type_map}
    end
  end
end
