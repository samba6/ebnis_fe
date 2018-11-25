defmodule EbnisWeb.FeatureCase do
  use Ebnis.HoundCase, async: false

  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Accounts.User

  @moduletag :integration

  # @tag :no_headless
  test "Sign Up" do
    # Given that a user reaches our page
    path() |> navigate_to()

    # She sees the login text in the page title
    assert page_title() =~ "Log in"

    # When she clicks on the sign up button
    click({:name, "to-sign-up"})

    # She sees the sign up text in the page title
    assert page_title() =~ "Sign up"

    %{email: email} = params = RegFactory.params()

    # When she fills in her name, email, password and password confirmation
    fill_field({:name, "name"}, params.name)
    fill_field({:name, "email"}, email)
    fill_field({:name, "password"}, params.password)
    fill_field({:name, "passwordConfirmation"}, params.password_confirmation)

    # And she submits the form
    submit_element({:name, "sign-up-submit"})

    # She is directed to home page
    assert retries(true, fn -> page_title() =~ "Home" end, 1_000)

    # And the user is created in our system
    assert %User{email: ^email, id: _} = Repo.get_by(User, email: email)
  end
end
