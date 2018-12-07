defmodule EbnisWeb.Schema.ExperienceTest do
  use Ebnis.DataCase, async: true

  alias EbnisWeb.Schema
  alias Ebnis.Factory.Experience, as: Factory
  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Factory.FieldDef, as: FieldDefFactory
  alias Ebnis.Query.Experience, as: Query

  @moduletag :db

  @invalid_field_types Enum.map(
                         ["integer1", "date2", "datetime2", "decimal4"],
                         &%{type: &1}
                       )

  describe "mutation" do
    # @tag :skip
    test "create an experience with field values succeeds" do
      %{title: title} = params = Factory.params()
      user = RegFactory.insert()

      variables = %{
        "exp" => Factory.stringify(params)
      }

      query = Query.create()

      assert {:ok,
              %{
                data: %{
                  "exp" => %{
                    "id" => _,
                    "title" => ^title,
                    "fieldDefs" => _
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
    test "create an experience fails if title (case insensitive) not unique for user" do
      user = RegFactory.insert()
      Factory.insert(title: "Good experience", user_id: user.id)

      variables = %{
        "exp" =>
          Factory.params(title: "good Experience")
          |> Factory.stringify()
      }

      query = Query.create()

      error = Jason.encode!(%{title: "has already been taken"})

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
    test "create an experience fails if field name (case insensitive) not unique for experience" do
      user = RegFactory.insert()

      attrs = %{
        field_defs: [
          FieldDefFactory.params(name: "Field 0"),
          FieldDefFactory.params(name: "field 0")
        ]
      }

      variables = %{
        "exp" =>
          attrs
          |> Factory.params()
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          field_defs: [
            %{name: "field 0---1 has already been taken"}
          ]
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
        field_defs: [
          Enum.random(@invalid_field_types) |> Map.put(:name, "invalid field")
        ]
      }

      variables = %{
        "exp" => Factory.params(attrs) |> Factory.stringify()
      }

      query = Query.create()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: _
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

  describe "get experience definition" do
    # @tag :skip
    test "get experience def succeeds for existing definition" do
      user = RegFactory.insert()
      %{id: id} = Factory.insert(user_id: user.id)
      id = Integer.to_string(id)

      variables = %{
        "exp" => %{
          "id" => id
        }
      }

      assert {:ok,
              %{
                data: %{
                  "exp" => %{
                    "id" => ^id
                  }
                }
              }} =
               Absinthe.run(
                 Query.get(),
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "get experience def fails for non existing definition" do
      user = RegFactory.insert()

      variables = %{
        "exp" => %{
          "id" => "0"
        }
      }

      assert {:ok,
              %{
                errors: [
                  %{
                    message: "Experience definition not found"
                  }
                ]
              }} =
               Absinthe.run(
                 Query.get(),
                 Schema,
                 variables: variables,
                 context: context(user)
               )
    end

    # @tag :skip
    test "get experience fails for wrong user" do
      user = RegFactory.insert()
      %{id: id} = Factory.insert(user_id: user.id)
      id = Integer.to_string(id)

      variables = %{
        "exp" => %{
          "id" => id
        }
      }

      another_user = RegFactory.insert()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: "Experience definition not found"
                  }
                ]
              }} =
               Absinthe.run(
                 Query.get(),
                 Schema,
                 variables: variables,
                 context: context(another_user)
               )
    end

    # @tag :skip
    test "get experience defs succeeds for existing definitions" do
      user = RegFactory.insert()
      %{id: id1} = Factory.insert(user_id: user.id)
      %{id: id2} = Factory.insert(user_id: user.id)
      id1 = Integer.to_string(id1)
      id2 = Integer.to_string(id2)

      assert {:ok,
              %{
                data: %{
                  "exps" => [
                    %{
                      "id" => ^id1
                    },
                    %{
                      "id" => ^id2
                    }
                  ]
                }
              }} =
               Absinthe.run(
                 Query.gets(),
                 Schema,
                 context: context(user)
               )
    end

    # @tag :skip
    test "get experience defs returns [] for none existing definitions" do
      user = RegFactory.insert()

      assert {:ok,
              %{
                data: %{
                  "exps" => []
                }
              }} =
               Absinthe.run(
                 Query.gets(),
                 Schema,
                 context: context(user)
               )
    end
  end

  defp context(user), do: %{current_user: user}
end
