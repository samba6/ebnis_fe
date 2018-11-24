defmodule EbnisWeb.Query.Credential do
  def all_fields_fragment do
    name = "CredentialAllFieldsFragment"

    fragment = """
      fragment #{name} on Credential {
        id
        source
        insertedAt
        updatedAt
      }
    """

    {name, fragment}
  end
end
