defmodule EbnisEmails.DefaultImplTest do
  use ExUnit.Case, async: true

  import Swoosh.TestAssertions
  import Mox

  alias EbnisEmails.DefaultImpl
  alias EbnisEmails.DefaultImpl.Composition
  alias EbnisEmails.MockEmails

  setup [:set_mox_from_context, :verify_on_exit!]

  test "send_welcome/1 sends welcome message to appropriate email" do
    email = "noreply@test.us"

    DefaultImpl.send_welcome(email)

    email
    |> Composition.welcome()
    |> assert_email_sent()
  end

  test "send_welcome/1 - we can swap implementation" do
    email = "noreply@test.us"

    expect(MockEmails, :send_welcome, fn ^email -> :ok end)

    EbnisEmails.send_welcome(email)
  end
end
