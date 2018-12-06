defmodule Ebnis.Experiences.DefaultImpl.Entry do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  # @primary_key false
  embedded_schema do
    field(:def_id, Ecto.UUID)
    field(:data, Ebnis.Experiences.DefaultImpl.EctoFieldVal)
  end

  @doc "changeset"
  def changeset, do: changeset(%__MODULE__{}, %{})
  def changeset(%__MODULE__{} = schema), do: changeset(schema, %{})

  def changeset(%__MODULE__{} = schema, attrs) when is_list(attrs),
    do: changeset(schema, Map.new(attrs))

  def changeset(%__MODULE__{} = schema, %{} = attrs) do
    schema
    |> cast(attrs, [:def_id, :data])
    |> validate_required([:def_id, :data])
  end
end
