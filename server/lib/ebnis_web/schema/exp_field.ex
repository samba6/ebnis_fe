defmodule EbnisWeb.Schema.ExpField do
  use Absinthe.Schema.Notation

  enum :field_type do
    value(:single_line_text)
    value(:multi_line_text)
    value(:integer)
    value(:decimal)
    value(:date)
    value(:datetime)
  end

  @desc "A ExpField"
  object :exp_field do
    field(:id, non_null(:id))

    @desc "Name of field e.g start, end, meal "
    field(:name, non_null(:string))

    @desc "The data type of the field"
    field(:type, non_null(:string))

    # FIELD TYPES

    @desc "A single line text field"
    field(:single_line_text, :string)

    @desc "A multi line text field"
    field(:multi_line_text, :string)

    @desc "An integer field type"
    field(:integer, :integer)

    @desc "A floating point number field type"
    field(:decimal, :float)

    @desc "Date field type"
    field(:date, :date)

    @desc "Datetime field type"
    field(:datetime, :iso_datetime)
  end

  @desc "Variables for creating field for an existing experience"
  input_object :create_exp_field do
    field(:name, non_null(:string))
    field(:type, non_null(:field_type))
    field(:value, :string)
  end
end
