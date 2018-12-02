defmodule Ebnis.Experiences.DefaultImpl.Field do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Experiences.DefaultImpl.Experience

  @field_types_atom [
    :single_line_text,
    :multi_line_text,
    :integer,
    :decimal,
    :date,
    :datetime
  ]

  @field_types_string Enum.map(@field_types_atom, &Atom.to_string/1)

  schema "exp_fields" do
    field(:name, :string)
    field(:type, :string)
    field(:single_line_text, :string)
    field(:multi_line_text, :string)
    field(:integer, :integer)
    field(:decimal, :float)
    field(:date, :date)
    field(:datetime, :utc_datetime)

    belongs_to(:experience, Experience)
  end

  @doc "changeset"
  def changeset(%__MODULE__{id: nil} = exp_field, %{} = attrs) do
    cast_and_validate(exp_field, attrs)
  end

  def changeset(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast_and_validate(attrs)
    |> validate_one_field_non_null()
  end

  defp cast_and_validate(%__MODULE__{} = exp_field, %{} = attrs) do
    exp_field
    |> cast(attrs, [
      :name,
      :type,
      :single_line_text,
      :multi_line_text,
      :integer,
      :decimal,
      :date,
      :datetime,
      :experience_id
    ])
    |> validate_required([:name, :experience_id, :type])
    |> assoc_constraint(:experience)
    |> unique_constraint(:name, name: :exp_fields_experience_id_name_index)
    |> validate_inclusion(:type, @field_types_string)
  end

  defp validate_one_field_non_null(%Changeset{valid?: false} = changeset) do
    add_error(changeset, :value, "You must provide a value for the field")
  end

  # exactly one of the fields types must be non null
  defp validate_one_field_non_null(%Changeset{changes: changes} = changeset) do
    count =
      Enum.reduce(changes, 0, fn
        {_, nil}, acc ->
          acc

        {k, _val}, acc when k in @field_types_atom ->
          acc + 1

        _, acc ->
          acc
      end)

    case count do
      0 ->
        add_error(changeset, :value, "You must provide a value for the field")

      _ ->
        changeset
    end
  end
end
