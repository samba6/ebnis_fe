defmodule Ebnis.Experiences.DefaultImpl do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  @behaviour Ebnis.Experiences.Impl

  def create_exp_def(attrs) do
    %ExpDef{}
    |> ExpDef.changeset(attrs)
    |> Repo.insert()
  end

  def get_exp_def(id, user_id) do
    ExpDef
    |> where([e], e.id == ^id and e.user_id == ^user_id)
    |> Repo.one()
    |> to_domain()
  end

  # defp to_domain(%Exp{} = experience) do
  #   struct(
  #     Ebnis.Experiences.DefaultImpl.Exp,
  #     Map.from_struct(experience)
  #   )
  # end

  defp to_domain(data), do: data
end
