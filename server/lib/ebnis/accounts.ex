defmodule Ebnis.Accounts do
  import Ecto.Query, warn: false
  import Comeonin.Bcrypt, only: [{:dummy_checkpw, 0}, {:checkpw, 2}]

  alias Ebnis.Accounts.Registration
  alias Ebnis.Repo
  alias Ebnis.Accounts.Credential

  def register(params) do
    Ecto.Multi.new()
    |> Registration.create(params)
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user, credential: credential}} ->
        {:ok,
         Map.put(user, :credential, %{
           credential
           | token: nil,
             password: nil
         })}

      {:error, failed_operations, changeset, _successes} ->
        {:error, failed_operations, changeset}
    end
  end

  def authenticate(%{email: email, password: password} = _params) do
    Credential
    |> join(:inner, [c], assoc(c, :user))
    |> where([c, u], u.email == ^email)
    |> preload([c, u], user: u)
    |> Repo.one()
    |> case do
      nil ->
        dummy_checkpw()
        {:error, "Invalid email/password"}

      %Credential{} = cred ->
        if checkpw(password, cred.token) do
          {:ok, cred}
        else
          {:error, "Invalid email/password"}
        end
    end
  end
end
