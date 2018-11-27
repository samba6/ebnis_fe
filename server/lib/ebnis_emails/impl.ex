defmodule EbnisEmails.Impl do
  @moduledoc false

  @callback send_welcome(EbnisEmails.email_address()) :: :ok
end
