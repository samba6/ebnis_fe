defmodule EbnisWeb.Feature.CreateExperienceTest do
  use Ebnis.HoundCase, async: false

  alias Ebnis.Factory.Registration, as: RegFactory

  @moduletag [integration: true, skip: true]

  # @tag :no_headless
  @tag :create_experience_feature
  test "create experience definition" do
    # User logs in
    %{email: email, password: password} = params = RegFactory.params()
    RegFactory.insert(params)
    path() |> navigate_to()
    fill_field({:name, "email"}, email)
    fill_field({:name, "password"}, password)
    submit_element({:name, "login-submit"})
    # Wait for home page to load
    retries(true, fn -> page_title() =~ "Home" end, 1_000)

    # When user clicks create new experience button
    click({:name, "go-to-create-exp-def"})

    # She sees new experience page title
    assert retries(
             true,
             fn -> page_title() =~ "Experience Definition" end,
             1_000
           )

    # When she fills the title field
    fill_field({:name, "title"}, "My new experience")

    # And she fills the experience field name field
    fill_field({:name, field_input_name(0, "name")}, "My field")

    # And she fills the experience field type field
    fill_field({:name, field_input_name(0, "type")}, "INTEGER")

    # When she clicks submit experience button
    click({:name, "exp-def-submit"})

    # She is redirected to add experience page where she sees the page title
    assert retries(
             true,
             fn -> page_title() =~ "Add Experience" end,
             1_000
           )

    # And there is an experience in the system
  end

  defp field_input_name(index, name) do
    "fields[#{index}].#{name}"
  end
end
