defmodule EbnisWeb.Schema.ExpDefTest do
  use Ebnis.DataCase, async: true

  alias EbnisWeb.Schema
  alias Ebnis.Factory.ExpDef, as: Factory
  alias Ebnis.Factory.Registration, as: RegFactory
  alias Ebnis.Factory.FieldDef, as: FieldDefFactory
  alias Ebnis.Query.ExpDef, as: Query

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
        "exp_def" => Factory.stringify(params)
      }

      query = Query.create()

      assert {:ok,
              %{
                data: %{
                  "exp_def" => %{
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
        "exp_def" =>
          Factory.params(title: "good Experience")
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          name: "exp_def",
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
    test "create an experience fails if field name (case insensitive) not unique for experience case insensitive" do
      user = RegFactory.insert()

      attrs = %{
        field_defs: [
          FieldDefFactory.params(name: "Field 0"),
          FieldDefFactory.params(name: "field 0")
        ]
      }

      variables = %{
        "exp_def" =>
          attrs
          |> Factory.params()
          |> Factory.stringify()
      }

      query = Query.create()

      error =
        %{
          name: "field 0---1",
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
        field_defs: [
          Enum.random(@invalid_field_types) |> Map.put(:name, "invalid field")
        ]
      }

      variables = %{
        "exp_def" => Factory.params(attrs) |> Factory.stringify()
      }

      query = Query.create()

      assert {:ok,
              %{
                errors: [
                  %{
                    message: _error
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
        "exp_def" => %{
          "id" => id
        }
      }

      assert {:ok,
              %{
                data: %{
                  "exp_def" => %{
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
        "exp_def" => %{
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
        "exp_def" => %{
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
  end

  defp context(user), do: %{current_user: user}
end
