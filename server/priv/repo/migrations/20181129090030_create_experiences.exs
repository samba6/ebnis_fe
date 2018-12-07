defmodule Ebnis.Repo.Migrations.CreateExperiences do
  use Ecto.Migration

  def change do
    execute("CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;")

    create table(:experiences) do
      add(:title, :citext, null: false)

      add(:description, :string)

      add(:user_id, references(:users, on_delete: :delete_all),
        null: false,
        comment: "The owner of the experience"
      )

      add(:field_defs, :jsonb,
        null: false,
        comment: "Field definitions that will be used for experience entry"
      )

      timestamps(type: :utc_datetime)
    end

    :experiences
    |> index([:user_id])
    |> create()

    :experiences
    |> unique_index([:user_id, :title])
    |> create()

    execute "CREATE INDEX experiences_field_defs ON experiences USING GIN (field_defs);"
  end
end
