defmodule Ebnis.Experiences.ExpField do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.Experience

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "exp_fields" do
    field(:name, :string)
    field(:single_line_text, :string)
    field(:multi_line_text, :string)
    field(:integer, :integer)
    field(:decimal, :float)
    field(:date, :date)
    field(:datetime, :utc_datetime)

    belongs_to(:experience, Experience)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast(attrs, [
      :name,
      :single_line_text,
      :multi_line_text,
      :integer,
      :decimal,
      :date,
      :datetime,
      :experience_id
    ])
    |> validate_required([:name, :experience_id])
    |> assoc_constraint(:experience)
    |> unique_constraint(:name, name: :exp_fields_experience_id_name_index)
    |> check_constraint(:value,
      name: :exact_one_field_type_non_null,
      message: "A value is required"
    )
  end
end
