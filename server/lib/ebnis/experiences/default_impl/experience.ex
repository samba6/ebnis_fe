defmodule Ebnis.Experiences.DefaultImpl.Experience do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Accounts.User
  alias Ebnis.Experiences.DefaultImpl.FieldDef
  alias Ebnis.Experiences.DefaultImpl.Entry

  @primary_key {:id, :id, autogenerate: true}
  @timestamps_opts [type: :utc_datetime]
  schema "experiences" do
    field(:title, :string)
    field(:description, :string)
    belongs_to(:user, User)
    embeds_many(:field_defs, FieldDef)
    has_many(:entries, Entry, foreign_key: :exp_id)

    timestamps()
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = schema, %{} = attrs) do
    schema
    |> cast(attrs, [:description, :title, :user_id])
    |> cast_embed(:field_defs, required: true)
    |> validate_required([:title, :user_id, :field_defs])
    |> validate_field_defs()
    |> assoc_constraint(:user)
    |> unique_constraint(:title, name: :experiences_user_id_title_index)
  end

  defp validate_field_defs(%Changeset{valid?: false} = changeset) do
    changeset
  end

  defp validate_field_defs(%Changeset{changes: changes} = changeset) do
    {field_defs, _names} =
      changes.field_defs
      |> Enum.with_index()
      |> Enum.reduce({[], []}, fn {field_changeset, index}, {acc, names} ->
        name = field_changeset.changes.name
        name_ = String.downcase(name)

        changeset =
          case Enum.member?(names, name_) do
            false ->
              field_changeset

            _ ->
              add_error(
                field_changeset,
                :name,
                "#{name}---#{index} has already been taken",
                validation: :uniqueness
              )
          end

        {[changeset | acc], [name_ | names]}
      end)

    put_change(changeset, :field_defs, Enum.reverse(field_defs))
  end
end
