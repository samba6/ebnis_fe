defmodule Ebnis.Experiences.DefaultImpl.FieldVal do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Experiences.DefaultImpl.Exp
  alias Ebnis.Experiences.DefaultImpl.FieldDef
  alias Ebnis.Experiences.DefaultImpl.EctoFieldVal

  schema "field_vals" do
    field(:type, :string)
    field(:value, EctoFieldVal)
    belongs_to(:exp, Exp)
    belongs_to(:def, FieldDef)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast(attrs, [
      :value,
      :type,
      :exp_id,
      :def_id
    ])
    |> validate_required([:exp_id, :def_id])
    |> assoc_constraint(:exp)
    |> assoc_constraint(:def)
    |> unique_constraint(
      :def,
      name: :field_vals_exp_id_def_id_index,
      message: "this field already in this experience"
    )
    |> foreign_key_constraint(:type, name: "field_vals_def_id_type_fkey")
    |> validate_type()
  end

  defp validate_type(%Changeset{valid?: false} = changeset), do: changeset

  defp validate_type(%Changeset{changes: %{type: _}} = changeset) do
    changeset
  end

  defp validate_type(%Changeset{changes: changes} = changeset) do
    [k | _] = Map.keys(changes.value)
    put_change(changeset, :type, k)
  end
end
