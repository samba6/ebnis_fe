use Mix.Config

app_port = System.get_env("EBNIS_PHOENIX_TEST_PORT") || 4023

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :ebnis, EbnisWeb.Endpoint,
  http: [port: app_port],
  server: true

# Print only warnings and errors during test
config :logger, level: :warn

config :ebnis, sql_sandbox: true

# Configure your database
config :ebnis, Ebnis.Repo,
  username: "postgres",
  password: "postgres",
  database: "ebnis_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox,
  timeout: 60_000,
  # 50 is default. Used to be called pool_timeout
  #  I will increase this if hound complains
  queue_target: 50,
  ownership_timeout: 60_000

config :hound,
  driver: "chrome_driver",
  app_host: "http://localhost",
  app_port: app_port,
  retry_time: 50_000,
  genserver_timeout: 480_000

config :ebnis, EbnisEmails.DefaultImpl.Mailer, adapter: Swoosh.Adapters.Test

config :constantizer, resolve_at_compile_time: false
