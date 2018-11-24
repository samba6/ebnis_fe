defmodule Ebnis.Accounts.User do
  use Ecto.Schema

  import Ecto.Changeset

  alias Ecto.Changeset
  alias Ebnis.Accounts.Credential

  schema "users" do
    field(:email, :string)
    field(:name, :string)
    field(:jwt, :string, virtual: true)

    has_one(:credential, Credential)

    timestamps()
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = user, attrs \\ %{}) do
    user
    |> cast(attrs, [:name, :email])
    |> validate()
  end

  @doc "Validation for new user"
  def validate_create(changes),
    do:
      %{changes | data: %__MODULE__{}}
      |> validate()

  defp validate(%Changeset{} = changes) do
    changes
    |> validate_required([:name, :email])
    |> validate_length(:name, min: 2, max: 20)
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:email)
  end
end
