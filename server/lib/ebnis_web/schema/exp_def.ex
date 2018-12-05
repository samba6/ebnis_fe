defmodule EbnisWeb.Schema.ExpDef do
  use Absinthe.Schema.Notation

  alias EbnisWeb.Resolver.ExpDef, as: Resolver

  @desc "A Experience"
  object :exp_def do
    field(:id, non_null(:id))

    field(:title, non_null(:string))
    field :description, :string

    field :field_defs, :field_def |> list_of() |> non_null() do
      resolve(&Resolver.field_defs/3)
    end

    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end

  @desc "Variables for creating Experience"
  input_object :create_exp_def do
    field(:title, non_null(:string))
    field(:description, :string)
    field(:field_defs, :create_field_def |> list_of() |> non_null())
  end

  @desc "Variables for getting an experience"
  input_object :get_exp_def do
    field(:id, non_null(:id))
  end

  @desc "Mutations allowed on Experience object"
  object :exp_def_mutation do
    @doc "Create an experience"
    field :exp_def, :exp_def do
      arg(:exp_def, non_null(:create_exp_def))

      resolve(&Resolver.create/3)
    end
  end

  @desc "Queries allowed on Experience object"
  object :exp_def_query do
    @desc "get all experiences belonging to a user"
    field :exp_defs, list_of(:exp_def) do
      resolve(&Resolver.get_exps/3)
    end

    @desc "get an experience"
    field :exp_def, :exp_def do
      arg(:exp_def, non_null(:get_exp_def))
      resolve(&Resolver.get_exp/3)
    end
  end
end
