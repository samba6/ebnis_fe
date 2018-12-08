defmodule Ebnis.Query.Entry do
  @frag_name "EntryFragment"

  @field_frag_name "EntryFieldFrag"

  @fragment """
    fragment #{@frag_name} on Entry {
      id
      insertedAt
      updatedAt
    }
  """

  @field_frag """
    fragment #{@field_frag_name} on Field {
      defId
      data
    }
  """

  def fragment do
    @fragment
  end

  def all_fields_fragment do
    {@frag_name, fragment()}
  end

  def create do
    """
    mutation CreateAnExperienceEntry($entry: CreateEntry!) {
      entry(entry: $entry) {
        ...#{@frag_name}
        fields {
          ...#{@field_frag_name}
        }
      }
    }

    #{@fragment}
    #{@field_frag}
    """
  end

  def get do
    """
    query GetAnExperienceEntry($entry: GetEntry!) {
      entry(entry: $entry) {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end

  def gets do
    """
    query GetEntriesForExperience($entry: GetExpEntries! ) {
      expEntries(entry: $entry) {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end
end
