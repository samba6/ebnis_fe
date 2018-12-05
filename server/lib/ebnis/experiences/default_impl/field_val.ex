defmodule Ebnis.Experiences.DefaultImpl.FieldVal do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.DefaultImpl.Exp
  alias Ebnis.Experiences.DefaultImpl.FieldDef

  schema "field_vals" do
    field(:single_line_text, :string)
    field(:multi_line_text, :string)
    field(:integer, :integer)
    field(:decimal, :float)
    field(:date, :date)
    field(:datetime, :utc_datetime)
    belongs_to(:exp, Exp)
    belongs_to(:def, FieldDef)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast(attrs, [
      :single_line_text,
      :multi_line_text,
      :integer,
      :decimal,
      :date,
      :datetime,
      :exp_id
    ])
    |> validate_required([:exp_id])
    |> assoc_constraint(:exp)
    |> check_constraint(
      :value,
      name: :field_vals_one_value_column_non_null,
      message: "value is invalid"
    )
  end
end
