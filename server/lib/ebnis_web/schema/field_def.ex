defmodule EbnisWeb.Schema.FieldDef do
  use Absinthe.Schema.Notation

  enum :field_type do
    value(:single_line_text, as: "single_line_text")
    value(:multi_line_text, as: "multi_line_text")
    value(:integer, as: "integer")
    value(:decimal, as: "decimal")
    value(:date, as: "date")
    value(:datetime, as: "datetime")
  end

  @desc "An Experience definition Field"
  object :field_def do
    field(:id, non_null(:id))

    @desc "Name of field e.g start, end, meal "
    field(:name, non_null(:string))

    @desc "The data type of the field"
    field(:type, non_null(:field_type))
  end

  @desc "Variables for creating field for an existing experience"
  input_object :create_field_def do
    field(:name, non_null(:string))
    field(:type, non_null(:field_type))
  end
end
