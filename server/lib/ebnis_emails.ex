defmodule EbnisEmails do
  @moduledoc ~S"""
    Used for sending emails to users
  """

  import Constantizer

  alias EbnisEmails.DefaultImpl

  @type email_address :: binary()

  @behaviour EbnisEmails.Impl

  @impl true
  @spec send_welcome(email_address) :: :ok
  def send_welcome(email_address) do
    impl().send_welcome(email_address)
  end

  defconstp impl do
    Application.get_env(:ebnis, :emails_impl, DefaultImpl)
  end
end
