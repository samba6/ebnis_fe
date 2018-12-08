defmodule Ebnis.Repo.Migrations.CreateEntries do
  use Ecto.Migration

  def change do
    create table(:entries) do
      add(:exp_id, references(:experiences, on_delete: :delete_all),
        null: false,
        comment: "The definition of the experience"
      )

      add(:fields, :jsonb, null: false)

      timestamps(type: :utc_datetime)
    end

    :entries
    |> index([:exp_id])
    |> create()

    execute "CREATE INDEX entries_fields ON entries USING GIN (fields);"
  end
end
