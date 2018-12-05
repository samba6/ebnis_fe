defmodule Ebnis.Experiences.DefaultImpl.FieldDef do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.DefaultImpl.ExpDef

  @field_types [
    "single_line_text",
    "multi_line_text",
    "integer",
    "decimal",
    "date",
    "datetime"
  ]

  schema "field_defs" do
    field(:name, :string)
    field(:type, :string)
    belongs_to(:exp_def, ExpDef)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast(attrs, [
      :name,
      :type,
      :exp_def_id
    ])
    |> validate_required([:name, :exp_def_id, :type])
    |> assoc_constraint(:exp_def)
    |> unique_constraint(:name, name: :field_defs_exp_def_id_name_index)
    |> validate_inclusion(:type, @field_types)
  end
end
