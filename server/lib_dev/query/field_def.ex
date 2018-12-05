defmodule Ebnis.Query.FieldDef do
  @frag_name "ExpFieldFragment"

  def fragment do
    """
      fragment #{@frag_name} on FieldDef {
        id
        name
        type
      }
    """
  end

  def all_fields_fragment do
    {@frag_name, fragment()}
  end
end
