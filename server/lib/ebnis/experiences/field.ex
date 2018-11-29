defmodule Ebnis.Experiences.Field do
  @moduledoc ~S"""
    The Ebnis.Experiences.Field struct
  """

  @enforce_keys [
    :id,
    :name
  ]

  @type t :: %__MODULE__{
          id: binary,
          name: binary,
          single_line_text: binary,
          multi_line_text: binary,
          integer: Integer.t(),
          decimal: Float.t(),
          date: Date.t(),
          datetime: DateTime.t(),
          experience: map
        }

  defstruct [
    :id,
    :name,
    :single_line_text,
    :multi_line_text,
    :integer,
    :decimal,
    :date,
    :datetime,
    :experience
  ]
end
