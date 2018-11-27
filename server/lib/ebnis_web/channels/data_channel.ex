defmodule EbnisWeb.DataChannel do
  use EbnisWeb, :channel

  @dialyzer {:no_return, run_query: 2, handle_in: 3}

  alias EbnisWeb.Schema
  alias Ebnis.Accounts.User

  @doc ~S"""
    Channel "data:pxz" = authenticated channel
  """

  def join("data:pxz", params, socket) do
    if can_join?(socket) do
      load_initial_data(params, socket)
    else
      {:error, %{}}
    end
  end

  @doc false
  def handle_in("graphql:pxz", params, socket) do
    {:reply, run_query(params, socket), socket}
  end

  defp load_initial_data(%{"query" => _, "variables" => _} = params, socket) do
    case run_query(params, socket) do
      {:error, _} -> {:ok, socket}
      {:ok, data} -> {:ok, data, socket}
    end
  end

  defp load_initial_data(_, socket), do: {:ok, socket}

  defp run_query(%{"query" => query} = params, socket) do
    case Absinthe.run(
           query,
           Schema,
           variables: params["variables"] || %{},
           context: %{current_user: socket.assigns[:user]}
         ) do
      {:ok, %{errors: errors}} ->
        {:error, %{errors: errors}}

      {:ok, %{data: data}} ->
        {:ok, %{data: data}}
    end
  end

  defp can_join?(socket) do
    case socket.assigns[:user] do
      %User{} -> true
      _ -> false
    end
  end
end
