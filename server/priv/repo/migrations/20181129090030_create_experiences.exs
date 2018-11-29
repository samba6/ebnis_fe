defmodule Ebnis.Repo.Migrations.CreateExperiences do
  use Ecto.Migration

  def change do
    execute("CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;")

    create table(:experiences, primary_key: false) do
      add(:id, :binary_id, primary_key: true, comment: "Primary key")
      add(:title, :citext, null: false)

      add(:user_id, references(:users, on_delete: :delete_all),
        null: false,
        comment: "The owner of experience"
      )

      timestamps(type: :utc_datetime)
    end

    :experiences
    |> index([:user_id])
    |> create()

    :experiences
    |> unique_index([:user_id, :title])
    |> create()
  end
end
