defmodule EbnisWeb.Schema.Entry do
  use Absinthe.Schema.Notation

  alias EbnisWeb.Resolver.Entry, as: Resolver

  @desc "An entry datetime data"
  object :datetime_data do
    field :datetime, non_null(:iso_datetime)
  end

  @desc "An entry integer data"
  object :integer_data do
    field :integer, non_null(:integer)
  end

  @desc "An entry decimal data"
  object :decimal_data do
    field :decimal, non_null(:float)
  end

  @desc "An entry field"
  object :field do
    field(:def_id, non_null(:id))
    field(:data, non_null(:entry_field_json))
  end

  @desc "An Experience entry"
  object :entry do
    field(:id, non_null(:id))
    field :fields, :field |> list_of() |> non_null()
    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end

  @desc "Variables for creating an entry field"
  input_object :create_field do
    field(:def_id, non_null(:id))
    field(:data, non_null(:entry_field_json))
  end

  @desc "Variables for creating an xperience entry"
  input_object :create_entry do
    @desc "The ID of the experience"
    field(:exp_id, non_null(:id))

    @desc "fields making up the experience entry"
    field(:fields, :create_field |> list_of() |> non_null())
  end

  @desc "Variables for getting an experience entry"
  input_object :get_entry do
    field(:id, non_null(:id))
  end

  @desc "Variables for getting all entries belonging to an experience"
  input_object :get_exp_entries do
    @desc "The ID of the experience"
    field(:exp_id, non_null(:id))
  end

  @desc "Mutations allowed on Experience entry object"
  object :entry_mutation do
    @doc "Create an experience"
    field :entry, :entry do
      arg(:entry, non_null(:create_entry))

      resolve(&Resolver.create/3)
    end
  end

  @desc "Queries allowed on Experience object"
  object :entry_query do
    @desc "get all experiences belonging to a user"
    field :exp_entries, list_of(:entry) do
      arg(:entry, non_null(:get_exp_entries))

      resolve(&Resolver.get_exp_entries/3)
    end
  end
end
