defmodule EbnisWeb.Schema.ExperienceTest do
  use Ebnis.DataCase, async: true

  alias EbnisWeb.Schema
  alias Ebnis.Factory.Experience, as: Factory
  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Query.Experience, as: Query

  @moduletag :db

  describe "mutation" do
    test "create an experience succeeds" do
      %{title: title} = params = Factory.params()
      user = RegFactory.insert()

      variables = %{
        "experience" =>
          Factory.stringify(params)
          |> Map.put("userId", user.id)
      }

      query = Query.create()

      assert {:ok,
              %{
                data: %{
                  "experience" => %{
                    "id" => _,
                    "title" => ^title
                  }
                }
              }} = Absinthe.run(query, Schema, variables: variables)
    end

    test "create an experience fails if title not unique for user" do
      user = RegFactory.insert()
      attrs = %{title: "Good experience", user_id: user.id}

      Factory.insert(attrs)

      variables = %{
        "experience" =>
          attrs
          |> Factory.params()
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          name: "experience",
          errors: %{title: "has already been taken"}
        }
        |> Jason.encode!()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} = Absinthe.run(query, Schema, variables: variables)
    end
  end
end
