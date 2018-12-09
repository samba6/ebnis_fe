defmodule EbnisWeb.Feature.CreateExperienceTest do
  use Ebnis.HoundCase, async: false

  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Experiences

  @moduletag :integration
  # @moduletag :skip

  # @tag :no_headless
  @tag :create_exp_feature
  test "create experience definition" do
    # User logs in
    %{email: email, password: password} = params = RegFactory.params()
    user = RegFactory.insert(params)
    path() |> navigate_to()
    fill_field({:name, "email"}, email)
    fill_field({:name, "password"}, password)
    submit_element({:name, "login-submit"})
    # Wait for home page to load
    assert retries(true, fn -> page_title() =~ "Home" end, 600)

    # When user clicks create new experience button
    click({:xpath, ~s|//button[@name="go-to-new-exp"]|})

    # She sees new experience page title
    assert retries(
             true,
             fn -> page_title() =~ "New Experience" end,
             1_000
           )

    # When she fills the title field
    fill_field({:name, "title"}, "Exp 1")

    # And she fills the experience field name field
    fill_field({:name, field_input_name(0, "name")}, "My field")

    # And she fills the experience field type field
    click({:xpath, ~s|//div[@name="#{field_input_name(0, "type")}"]|})
    click({:xpath, ~s|//span[text()="INTEGER"]|})

    # When she clicks submit experience button
    click({:name, "new-exp-submit"})

    # She is redirected to add experience page where she sees the page title
    assert retries(
             true,
             fn -> page_title() =~ "Exp 1" end,
             1_000
           )

    # And there is an experience in the system
    user_id = user.id

    assert [
             %{
               user_id: ^user_id,
               title: "Exp 1"
             }
           ] = Experiences.get_user_exps(user_id)
  end

  defp field_input_name(index, name) do
    "fieldDefs[#{index}]#{name}"
  end
end
