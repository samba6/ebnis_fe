defmodule EbnisWeb.Feature.NewEntryTest do
  use Ebnis.HoundCase, async: false

  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Factory.Experience, as: ExpFactory
  alias Ebnis.Experiences

  @moduletag :integration
  # @moduletag :skip

  # @tag :no_headless
  @tag :create_exp_feature
  test "create experience definition" do
    # Given there is a user in the system
    %{email: email, password: password} = params = RegFactory.params()
    user = RegFactory.insert(params)

    # And user has an experience in the system

    %{title: title} =
      %{id: exp_id} =
      ExpFactory.insert(
        user_id: user.id,
        field_defs: [
          %{
            name: "My field",
            type: "decimal"
          }
        ]
      )

    # When user logs in
    path() |> navigate_to()
    fill_field({:name, "email"}, email)
    fill_field({:name, "password"}, password)
    submit_element({:name, "login-submit"})

    # She is redirected to the home page
    retries(true, fn -> page_title() =~ "Home" end, 600)

    # And she see's the experience title
    assert retries(
             true,
             fn -> Regex.compile!(title) |> visible_in_page?() end,
             1_000
           )

    # When user clicks on experience title
    click({:xpath, ~s|//span[text()="#{title}"]|})

    # She sees that page title has changed to experience title
    assert retries(true, fn -> page_title() =~ title end, 1_000)

    # When user clicks on new experience entry button
    click({:xpath, ~s|//button[text()="New entry"]|})

    # She sees that page title has changed to experience title prefixed with
    # the word "New"
    assert retries(true, fn -> page_title() =~ "New #{title}" end, 1_000)

    # When she fills the text field
    fill_field({:name, "fields[0]"}, 20.0089)

    # And submits the form
    click({:xpath, ~s|//button[text()="Submit"]|})

    # She sees the form input on the page
    assert retries(true, fn -> visible_in_page?(~r|20\.0089|) end, 1_000)

    # And there is an entry in the system
    assert [
             %{
               exp_id: ^exp_id,
               fields: _
             }
           ] = Experiences.get_exp_entries(exp_id, user.id)
  end
end
