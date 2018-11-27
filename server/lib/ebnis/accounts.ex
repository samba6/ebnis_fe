defmodule Ebnis.Accounts do
  import Ecto.Query, warn: false
  import Comeonin.Bcrypt, only: [{:dummy_checkpw, 0}, {:checkpw, 2}]

  alias Ebnis.Accounts.Registration
  alias Ebnis.Repo
  alias Ebnis.Accounts.Credential
  alias EbnisEmails
  alias Ebnis.Accounts.User

  def register(%{} = params, opts \\ []) do
    Ecto.Multi.new()
    |> Registration.create(params)
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user, credential: credential}} ->
        user_with_credential =
          Map.put(user, :credential, %{
            credential
            | token: nil,
              password: nil
          })

        post_registration(user_with_credential, opts)

      {:error, failed_operations, changeset, _successes} ->
        {:error, failed_operations, changeset}
    end
  end

  defp post_registration(%User{} = user, []), do: {:ok, user}

  defp post_registration(%User{} = user, opts) do
    case Keyword.fetch(opts, :send_welcome) do
      {:ok, _} ->
        :ok = EbnisEmails.send_welcome(user.email)
    end

    {:ok, user}
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
