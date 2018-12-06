defmodule Ebnis.Experiences.DefaultImpl.Exp do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Experiences.DefaultImpl.FieldVal
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  schema "exps" do
    belongs_to(:def, ExpDef)
    has_many(:fields, FieldVal)

    timestamps(type: :utc_datetime)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp, %{} = attrs) do
    exp
    |> cast(attrs, [:def_id])
    |> validate_required([:def_id])
    |> assoc_constraint(:def)
  end
end
