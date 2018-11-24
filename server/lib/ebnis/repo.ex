defmodule Ebnis.Repo do
  use Ecto.Repo,
    otp_app: :ebnis,
    adapter: Ecto.Adapters.Postgres
end
