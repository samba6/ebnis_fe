defmodule EbnisWeb.Schema.ExperienceTest do
  use Ebnis.DataCase, async: true

  alias EbnisWeb.Schema
  alias Ebnis.Factory.Experience, as: Factory
  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Factory.ExpField, as: ExpFieldFactory
  alias Ebnis.Query.Experience, as: Query

  @moduletag :db

  @invalid_field_types for k <- ["integer", "date", "datetime", "decimal"],
                           do: Map.put(%{}, k, "a")

  describe "mutation" do
    # @tag :skip
    test "create an experience with field values succeeds" do
      %{title: title} = params = Factory.params()
      user = RegFactory.insert()

      variables = %{
        "experience" => Factory.stringify(params)
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
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an experience without field values succeeds" do
      user = RegFactory.insert()

      params =
        Factory.params(
          fields: [
            %{
              name: "Field x",
              type: "decimal"
            }
          ]
        )

      variables = %{
        "experience" => Factory.stringify(params)
      }

      query = Query.create()

      assert {:ok,
              %{
                data: %{
                  "experience" => %{
                    "id" => _,
                    "title" => _title
                  }
                }
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an experience fails if title not unique for user regardless of case" do
      user = RegFactory.insert()
      Factory.insert(title: "Good experience", user_id: user.id)

      variables = %{
        "experience" =>
          Factory.params(title: "good Experience")
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
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an experience fails if field not unique for experience case insensitive" do
      user = RegFactory.insert()

      attrs = %{
        fields: [
          ExpFieldFactory.params(name: "Field 0"),
          ExpFieldFactory.params(name: "field 0")
        ]
      }

      variables = %{
        "experience" =>
          attrs
          |> Factory.params()
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          name: "field 0",
          errors: %{name: "has already been taken"}
        }
        |> Jason.encode!()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "create an experience fails if field has wrong data type" do
      user = RegFactory.insert()

      attrs = %{
        fields: [
          @invalid_field_types
          |> Enum.random()
          |> Map.put(:name, "invalid field")
        ]
      }

      variables = %{
        "experience" =>
          attrs
          |> Factory.params()
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          name: "invalid field",
          errors: %{value: "is invalid"}
        }
        |> Jason.encode!()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: ^error
                  }
                ]
              }} =
               Absinthe.run(
                 query,
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end
  end

  defp context(user), do: %{current_user: user}
end
