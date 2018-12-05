defmodule Ebnis.Experiences.DefaultImpl.Exp do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.DefaultImpl.FieldVal
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  schema "exps" do
    belongs_to(:def, ExpDef)
    has_many(:fields, FieldVal)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp, %{} = attrs) do
    exp
    |> cast(attrs, [:def_id])
    |> validate_required([:name, :def_id, :type])
    |> assoc_constraint(:def)
  end
end
