defmodule EbnisWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ebnis

  socket "/socket", EbnisWeb.UserSocket,
    websocket: true,
    longpoll: false

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
