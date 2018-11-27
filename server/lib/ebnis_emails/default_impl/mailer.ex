defmodule EbnisEmails.DefaultImpl.Mailer do
  @moduledoc false
  use Swoosh.Mailer, otp_app: :ebnis
end
