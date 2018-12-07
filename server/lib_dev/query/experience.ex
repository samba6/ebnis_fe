defmodule Ebnis.Query.Experience do
  alias Ebnis.Query.FieldDef

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
    {field_frag_name, field_frag} = FieldDef.all_fields_fragment()

    """
    mutation CreateAnExperience($exp: CreateExp!) {
      exp(exp: $exp) {
        ...#{@frag_name}
        fieldDefs {
          ...#{field_frag_name}
        }
      }
    }

    #{@fragment}
    #{field_frag}
    """
  end

  def get do
    """
    query GetAnExperience($exp: GetExp!) {
      exp(exp: $exp) {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end

  def gets do
    """
    query GetExperiences {
      exps {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end
end
