defmodule Ebnis.Query.ExpDef do
  alias Ebnis.Query.FieldDef

  @frag_name "ExpDefFragment"

  @fragment """
    fragment #{@frag_name} on ExpDef {
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
    mutation CreateAnExpDef($exp_def: CreateExpDef!) {
      exp_def(exp_def: $exp_def) {
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
    query GetAnExpDef($exp_def: GetExpDef!) {
      exp_def(exp_def: $exp_def) {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end

  def gets do
    """
    query GetExpDefs {
      exp_defs {
        ...#{@frag_name}

      }
    }

    #{@fragment}

    """
  end
end
