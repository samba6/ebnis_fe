defmodule Ebnis.Query.Field do
  @frag_name "ExpFieldFragment"

  def fragment do
    """
      fragment #{@frag_name} on ExpField {
        id
        name
        singleLineText
        multiLineText
        integer
        decimal
        date
        datetime
      }
    """
  end

  def all_fields_fragment do
    {@frag_name, fragment()}
  end
end
