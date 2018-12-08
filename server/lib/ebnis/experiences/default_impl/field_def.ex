defmodule Ebnis.Experiences.DefaultImpl.FieldDef do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.DefaultImpl.EctoFieldVal

  @all_types EctoFieldVal.all_types()

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
    |> validate_inclusion(:type, @all_types)
  end
end
