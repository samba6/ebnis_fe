defmodule EbnisWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ebnis
  use Absinthe.Phoenix.Endpoint

  if Application.get_env(:ebnis, :sql_sandbox) do
    plug(Phoenix.Ecto.SQL.Sandbox)
  end

  socket("/socket", EbnisWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: true
  )

  plug(Plug.RequestId)
  plug(Plug.Logger)

  plug(
    Plug.Parsers,
    parsers: [
      :urlencoded,
      :multipart,
      :json,
      Absinthe.Plug.Parser
    ],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)

  plug(
    Corsica,
    origins: "*",
    allow_headers: ~w(Accept Content-Type Authorization Origin)
  )

  plug(EbnisWeb.Router)

  @doc """
  Callback invoked for dynamically configuring the endpoint.

  It receives the endpoint configuration and checks if
  configuration should be loaded from the system environment.
  """
  def init(_key, config) do
    if config[:load_from_system_env] do
      port = System.get_env("PORT") || raise "expected the PORT environment variable to be set"
      {:ok, Keyword.put(config, :http, [:inet6, port: port])}
    else
      {:ok, config}
    end
  end
end
