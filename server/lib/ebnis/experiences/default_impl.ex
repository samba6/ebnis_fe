defmodule Ebnis.Experiences.DefaultImpl do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ebnis.Experiences.DefaultImpl.Experience

  @behaviour Ebnis.Experiences.Impl

  def create_exp(attrs) do
    %Experience{}
    |> Experience.changeset(attrs)
    |> Repo.insert()
  end

  def get_exp(id, user_id) do
    Experience
    |> where([e], e.id == ^id and e.user_id == ^user_id)
    |> Repo.one()
    |> to_domain()
  end

  def get_exps(user_id) do
    Experience
    |> where([e], e.user_id == ^user_id)
    |> Repo.all()
  end

  # defp to_domain(%Exp{} = experience) do
  #   struct(
  #     Ebnis.Experiences.DefaultImpl.Exp,
  #     Map.from_struct(experience)
  #   )
  # end

  defp to_domain(data), do: data
end
