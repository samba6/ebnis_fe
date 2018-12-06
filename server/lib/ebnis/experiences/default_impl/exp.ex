defmodule Ebnis.Experiences.DefaultImpl.Exp do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Experiences.DefaultImpl.ExpDef
  alias Ebnis.Experiences.DefaultImpl.Entry

  @timestamps_opts [type: :utc_datetime]
  schema "exps" do
    belongs_to(:def, ExpDef)
    embeds_many(:entries, Entry)

    timestamps()
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp, %{} = attrs) do
    exp
    |> cast(attrs, [:def_id])
    |> cast_embed(:entries, required: true)
    |> validate_required([:def_id, :entries])
    |> validate_entries(attrs[:field_def_ids])
    |> assoc_constraint(:def)
  end

  defp validate_entries(%Changeset{valid?: false} = changeset, _) do
    changeset
  end

  defp validate_entries(
         %Changeset{changes: changes} = changeset,
         field_def_ids
       ) do
    {entries, _} =
      Enum.reduce(
        changes.entries,
        {[], []},
        fn entry_changeset, {acc, def_ids} ->
          def_id = entry_changeset.changes.def_id

          new_changeset =
            case Enum.member?(field_def_ids, def_id) do
              true ->
                case Enum.member?(def_ids, def_id) do
                  false ->
                    entry_changeset

                  _ ->
                    add_error(
                      entry_changeset,
                      :def_id,
                      "has already been taken",
                      validation: :uniqueness
                    )
                end

              _ ->
                add_error(
                  entry_changeset,
                  :def_id,
                  "does not exists",
                  validation: :assoc
                )
            end

          {[new_changeset | acc], [def_id | def_ids]}
        end
      )

    put_change(changeset, :entries, Enum.reverse(entries))
  end
end
