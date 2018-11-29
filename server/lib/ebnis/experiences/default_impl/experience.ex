defmodule Ebnis.Experiences.DefaultImpl.Experience do
  use Ecto.Schema, warn: true

  import Ecto.Changeset

  alias Ebnis.Accounts.User
  alias Ebnis.Experiences.DefaultImpl.Field

  @primary_key {:id, :binary_id, autogenerate: true}
  # @foreign_key_type :binary_id - the type of user is not binary id
  schema "experiences" do
    field(:title, :string)
    belongs_to(:user, User)
    has_many(:fields, Field)

    timestamps(type: :utc_datetime)
  end

  @doc "changeset"
  def changeset(%__MODULE__{} = exp, %{} = attrs) do
    exp
    |> cast(attrs, [:title, :user_id])
    |> assoc_constraint(:user)
    |> unique_constraint(:title, name: :experiences_user_id_title_index)
  end
end
