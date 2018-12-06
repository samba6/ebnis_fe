defmodule Ebnis.Repo.Migrations.CreateExps do
  use Ecto.Migration

  def change do
    create table(:exps) do
      add(:def_id, references(:exp_defs, on_delete: :delete_all),
        null: false,
        comment: "The definition of the experience"
      )

      add(:entries, :jsonb, null: false)

      timestamps(type: :utc_datetime)
    end

    :exps
    |> index([:def_id])
    |> create()

    execute "CREATE INDEX exps_entries ON exps USING GIN (entries);"
  end
end
