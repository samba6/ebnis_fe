defmodule EbnisEmails.DefaultImpl do
  @moduledoc false

  alias EbnisEmails.DefaultImpl.Mailer
  alias EbnisEmails.DefaultImpl.Composition

  @behaviour EbnisEmails.Impl

  @type email_address :: EbnisEmails.email_address()

  @impl true
  @spec send_welcome(email_address) :: :ok
  def send_welcome(email_address) do
    email_address |> Composition.welcome() |> Mailer.deliver()
    :ok
  end
end
