defmodule EbnisWeb.Feature.LoginTest do
  use Ebnis.HoundCase, async: false

  alias Ebnis.Factory.Registration, as: RegFactory

  @moduletag :integration

  # @tag :no_headless
  @tag :log_in_feature
  test "Login" do
    # Given a user exists in the system
    params = RegFactory.params()
    RegFactory.insert(params)

    # When a user reaches our page
    path() |> navigate_to()

    # She sees the login text in the page title
    assert page_title() =~ "Log in"

    # When she fills in her email and password
    fill_field({:name, "email"}, params.email)
    fill_field({:name, "password"}, params.password)

    # And she submits the form
    submit_element({:name, "login-submit"})

    # She is redirected to home page
    assert retries(true, fn -> page_title() =~ "Home" end, 1_000)
  end

  test "Create experience" do
  end
end
