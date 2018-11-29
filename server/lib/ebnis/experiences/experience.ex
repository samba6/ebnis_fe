defmodule Ebnis.Experiences.Experience do
  @moduledoc ~S"""
    The Ebnis.Experiences.Experience struct
  """
  @enforce_keys [
    :id,
    :title
  ]

  @type t :: %__MODULE__{
          id: binary,
          title: binary,
          user: map,
          fields: List.t()
        }

  defstruct [
    :id,
    :title,
    :user,
    :fields
  ]
end
