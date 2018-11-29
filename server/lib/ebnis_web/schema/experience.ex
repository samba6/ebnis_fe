defmodule EbnisWeb.Schema.Experience do
  use Absinthe.Schema.Notation

  alias EbnisWeb.Experience.Resolver

  @desc "A Experience"
  object :experience do
    field(:id, non_null(:id))

    field(:title, non_null(:string))
    field(:fields, :exp_field |> list_of() |> non_null())

    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end

  @desc "Variables for creating Experience"
  input_object :create_experience do
    field(:user_id, non_null(:id))
    field(:title, non_null(:string))
    field(:fields, :create_exp_field |> list_of() |> non_null())
  end

  @desc "Mutations allowed on Experience object"
  object :experience_mutation do
    @doc "Create an experience"
    field :experience, :experience do
      arg(:experience, non_null(:create_experience))

      resolve(&Resolver.create/3)
    end
  end

  @desc "Queries allowed on Experience object"
  object :experience_query do
    @desc "get all experiences belonging to a user"
    field :experiences, list_of(:experience) do
      resolve(&Resolver.field/3)
    end
  end
end
