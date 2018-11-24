defmodule EbnisWeb.Plug.AuthContexts do
  @behaviour Plug

  alias EbnisWeb.Auth.Guardian, as: GuardianApp

  @doc false
  def init(opts), do: opts

  @doc false
  def call(conn, _) do
    case GuardianApp.Plug.current_resource(conn) do
      nil ->
        conn

      user ->
        Absinthe.Plug.put_options(conn, context: %{current_user: user})
    end
  end
end
