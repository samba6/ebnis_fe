defmodule Ebnis.Experiences.DefaultImpl.FieldDef do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  @field_types [
    "single_line_text",
    "multi_line_text",
    "integer",
    "decimal",
    "date",
    "datetime"
  ]

  # @primary_key false
  embedded_schema do
    field(:name, :string)
    field(:type, :string)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = field_def, attrs \\ %{}) do
    field_def
    |> cast(attrs, [
      :name,
      :type
    ])
    |> validate_required([:name, :type])
    |> validate_length(:name, min: 2)
    |> validate_inclusion(:type, @field_types)
  end
end
