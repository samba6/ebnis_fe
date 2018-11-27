Absinthe.Test.prime(EbnisWeb.Schema)
{:ok, _} = Application.ensure_all_started(:hound)
ExUnit.start(exclude: [integration: true, db: true])
Ecto.Adapters.SQL.Sandbox.mode(Ebnis.Repo, :manual)

Mox.defmock(EbnisEmails.MockEmails, for: EbnisEmails.Impl)
Application.put_env(:ebnis, :emails_impl, EbnisEmails.MockEmails)
