defmodule EbnisWeb.Resolver do
  @moduledoc """
  Helper utilities for resolvers
  """

  @unauthorized "Unauthorized"

  @spec unauthorized() :: {:error, [{:message, <<_::96>>}, ...]}
  def unauthorized do
    {:error, message: @unauthorized}
  end

  @doc """
  Take an error returned by applying Ecto.Repo.transaction to a Multi
  operation and return a string representation.
  """
  @spec transaction_errors_to_string(%Ecto.Changeset{}, Multi.name()) :: String.t()
  def transaction_errors_to_string({:error, changeset}, failed_operation),
    do: transaction_errors_to_string(changeset, failed_operation)

  def transaction_errors_to_string(%{} = changeset, failed_operation) do
    %{
      name: failed_operation,
      errors: changeset_errors_to_map(changeset)
    }
    |> Jason.encode!()
  end

  def changeset_errors_to_string(errors),
    do:
      errors
      |> changeset_errors_to_map()
      |> Jason.encode!()

  defp changeset_errors_to_map(%{errors: errors}),
    do:
      errors
      |> Enum.map(fn
        {k, {v, opts}} ->
          {k, error_value(v, opts)}

        kv ->
          kv
      end)
      |> Enum.into(%{})

  defp error_value(v, opts) do
    case(Keyword.fetch(opts, :count)) do
      :error ->
        v

      {:ok, count} ->
        String.replace(v, "%{count}", to_string(count))
    end
  end
end
