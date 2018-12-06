defmodule Ebnis.Repo.Migrations.CreateExpDefs do
  use Ecto.Migration

  def change do
    execute("CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;")

    create table(:exp_defs) do
      add(:title, :citext, null: false)

      add(:description, :string)

      add(:user_id, references(:users, on_delete: :delete_all),
        null: false,
        comment: "The owner of the experience"
      )

      add(:field_defs, :jsonb, null: false)
      add(:entries, :jsonb, null: false, default: "[]")

      timestamps(type: :utc_datetime)
    end

    :exp_defs
    |> index([:user_id])
    |> create()

    :exp_defs
    |> unique_index([:user_id, :title])
    |> create()

    execute "CREATE INDEX exp_defs_field_defs ON exp_defs USING GIN (field_defs);"
    execute "CREATE INDEX exp_defs_entries ON exp_defs USING GIN (entries);"
  end
end
