defmodule Ebnis.Query.Experience do
  alias Ebnis.Query.Field

  @frag_name "ExperienceFragment"

  @fragment """
    fragment #{@frag_name} on Experience {
      id
      title
      description
    }
  """

  def fragment do
    @fragment
  end

  def all_fields_fragment do
    {@frag_name, fragment()}
  end

  def create do
    {field_frag_name, field_frag} = Field.all_fields_fragment()

    """
    mutation CreateAnExperience($experience: CreateExperience!) {
      experience(experience: $experience) {
        ...#{@frag_name}
        fields {
          ...#{field_frag_name}
        }
      }
    }

    #{@fragment}
    #{field_frag}
    """
  end
end
