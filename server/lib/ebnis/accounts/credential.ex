defmodule Ebnis.Accounts.Credential do
  use Ecto.Schema

  import Ecto.Changeset
  import Comeonin.Bcrypt, only: [hashpwsalt: 1]

  alias Ecto.Changeset
  alias Ebnis.Accounts.User

  schema "credentials" do
    field(:source, :string)
    field(:token, :string)

    field(:password, :string, virtual: true)

    belongs_to(:user, User)
    timestamps()
  end

  @doc false
  def changeset(%__MODULE__{} = credential, attrs \\ %{}) do
    credential
    |> cast(attrs, [:source, :token, :user_id, :password])
    |> validate()
  end

  def validate(%Changeset{} = changes) do
    changes
    |> validate_required([:source])
    |> unique_constraint(:source, name: :credential_user_id_source_index)
    |> hash_password()
  end

  defp hash_password(
         %Changeset{
           valid?: true,
           changes: %{
             source: "password",
             password: password
           }
         } = changes
       ) do
    put_change(changes, :token, hashpwsalt(password))
  end

  defp hash_password(changes), do: changes
end
