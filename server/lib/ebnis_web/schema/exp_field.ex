defmodule EbnisWeb.Schema.ExpField do
  use Absinthe.Schema.Notation

  @desc "A ExpField"
  object :exp_field do
    field(:id, non_null(:id))

    @desc "Name of field e.g start, end, meal "
    field(:name, non_null(:string))

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
    @desc "The experience to which the field belongs"
    field(:name, non_null(:string))

    field(:single_line_text, :string)
    field(:multi_line_text, :string)
    field(:integer, :integer)
    field(:decimal, :float)
    field(:date, :date)
    field(:datetime, :iso_datetime)
  end
end
