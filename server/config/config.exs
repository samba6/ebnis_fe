# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :ebnis,
  ecto_repos: [Ebnis.Repo]

# Configures the endpoint
config :ebnis, EbnisWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "IgXlpm0kYEMVeuAEMGrEyaHL7bgiY/zbKdHu00dOMwO0IhWKyPA3/Un5zCpz+0u1",
  render_errors: [view: EbnisWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Ebnis.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :ebnis, EbnisWeb.Auth.Guardian,
  issuer: "ebnis",
  secret_key: "DfAHXB4gq6YbApF5c5NgBP0kKpaaobjhFodpDzmceiaXfcPMZKDN1sBCTDHQ2RBy"

config :ebnis, EbnisWeb.Auth.Pipeline,
  module: EbnisWeb.Auth.Guardian,
  error_handler: EbnisWeb.Auth.Guardian

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
