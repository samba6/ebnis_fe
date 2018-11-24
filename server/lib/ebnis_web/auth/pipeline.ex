defmodule EbnisWeb.Auth.Pipeline do
  use Guardian.Plug.Pipeline, otp_app: :ebnis

  plug(Guardian.Plug.VerifyHeader, realm: "Bearer")
  plug(Guardian.Plug.LoadResource, allow_blank: true)
end
