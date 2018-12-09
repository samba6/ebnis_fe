defmodule EbnisWeb.Schema.Experience do
  use Absinthe.Schema.Notation

  alias EbnisWeb.Resolver.Experience, as: Resolver

  @desc "An Experience"
  object :experience do
    field(:id, non_null(:id))

    field(:title, non_null(:string))
    field(:description, :string)

    @desc "The field definitions used for the experience entries"
    field(:field_defs, :field_def |> list_of() |> non_null())

    field(:entries, :entry |> list_of() |> non_null())

    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end

  @desc "Variables for creating Experience"
  input_object :create_exp do
    field(:title, non_null(:string))
    field(:description, :string)
    field(:field_defs, :create_field_def |> list_of() |> non_null())
  end

  @desc "Variables for getting an experience"
  input_object :get_exp do
    field(:id, non_null(:id))
  end

  @desc "Mutations allowed on Experience object"
  object :exp_mutation do
    @doc "Create an experience"
    field :exp, :experience do
      arg(:exp, non_null(:create_exp))

      resolve(&Resolver.create/3)
    end
  end

  @desc "Queries allowed on Experience object"
  object :exp_query do
    @desc "get all experiences belonging to a user"
    field :exps, list_of(:experience) do
      resolve(&Resolver.get_user_exps/3)
    end

    @desc "get an experience"
    field :exp, :experience do
      arg(:exp, non_null(:get_exp))
      resolve(&Resolver.get_exp/3)
    end
  end
end
