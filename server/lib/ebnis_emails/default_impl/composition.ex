defmodule EbnisEmails.DefaultImpl.Composition do
  @moduledoc false
  import Swoosh.Email

  @from_email "noreply@ebnis.com"

  def welcome(email) do
    new()
    |> to(email)
    |> from(@from_email)
    |> subject("Welcome to Ebnis!")
    |> html_body("<h1>Thanks for signing up for Ebnis, #{email}!</h1>")
  end
end
