defmodule Ebnis.Repo.Migrations.CreateCredentials do
  use Ecto.Migration

  def change do
    create table(:credentials) do
      add(:source, :string,
        null: false,
        default: "password",
        comment: "The authentication source e.g. password, google, facebook etc."
      )

      add(:token, :string,
        null: false,
        comment: "E.g. password hash or token from auth source"
      )

      add(:user_id, references(:users, on_delete: :delete_all),
        null: false,
        comment: "The owner of the credential"
      )

      timestamps()
    end

    :credentials
    |> index([:source, :token])
    |> create()

    :credentials
    |> unique_index([:user_id, :source])
    |> create()
  end
end
