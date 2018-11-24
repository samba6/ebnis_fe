defmodule EbnisWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ebnis
  use Absinthe.Phoenix.Endpoint

  socket "/socket", EbnisWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: true

  plug Plug.RequestId
  plug Plug.Logger

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json, Absinthe.Plug.Parser],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head

  plug EbnisWeb.Router
end
