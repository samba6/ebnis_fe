defmodule Ebnis.Repo.Migrations.CreateExperienceDefs do
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

      timestamps(type: :utc_datetime)
    end

    :exp_defs
    |> index([:user_id])
    |> create()

    :exp_defs
    |> unique_index([:user_id, :title])
    |> create()
  end
end
