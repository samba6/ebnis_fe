defmodule Ebnis.Accounts.Credentials do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ebnis.Accounts.Credential

  @doc """
  Returns the list of credentials.

  ## Examples

      iex> list()
      [%Credential{}, ...]

  """
  def list do
    Repo.all(Credential)
  end

  @doc """
  Gets a single credential.

  Raises `Ecto.NoResultsError` if the Credential does not exist.

  ## Examples

      iex> get(123)
      %Credential{}

      iex> get(456)
      ** nil

  """
  def get(id), do: Repo.get(Credential, id)

  @doc """
  Creates a credential.

  ## Examples

      iex> create_(%{field: value})
      {:ok, %Credential{}}

      iex> create_(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_(%Ecto.Changeset{} = changes) do
    Repo.insert(changes)
  end

  def create_(attrs) do
    %Credential{}
    |> Credential.changeset(attrs)
    |> create_()
  end

  @doc """
  Updates a credential.

  ## Examples

      iex> update_(credential, %{field: new_value})
      {:ok, %Credential{}}

      iex> update_(credential, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_(%Credential{} = credential, attrs) do
    credential
    |> Credential.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Credential.

  ## Examples

      iex> delete_(credential)
      {:ok, %Credential{}}

      iex> delete_(credential)
      {:error, %Ecto.Changeset{}}

  """
  def delete_(%Credential{} = credential) do
    Repo.delete(credential)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking credential changes.

  ## Examples

      iex> change_(credential, %{})
      %Ecto.Changeset{source: %Credential{}}

  """
  def change_(%Credential{} = credential, attrs \\ %{}) do
    Credential.changeset(credential, attrs)
  end
end
