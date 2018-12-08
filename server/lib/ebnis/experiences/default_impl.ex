defmodule Ebnis.Experiences.DefaultImpl do
  import Ecto.Query, warn: false

  alias Ebnis.Repo
  alias Ebnis.Experiences.DefaultImpl.Experience
  alias Ebnis.Experiences.DefaultImpl.Entry

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

  def get_exp_field_defs(exp_id, user_id) do
    Experience
    |> where([e], e.id == ^exp_id and e.user_id == ^user_id)
    |> select([e], e.field_defs)
    |> Repo.one()
  end

  def create_entry(%{} = attrs) do
    %Entry{}
    |> Entry.changeset(attrs)
    |> Repo.insert()
  end

  @spec get_exp_entries(
          exp_id :: integer | binary,
          user_id :: integer | binary
        ) :: [Entry.t()]
  def get_exp_entries(exp_id, user_id) do
    Entry
    |> join(:inner, [ee], e in assoc(ee, :exp))
    |> where([_, e], e.id == ^exp_id and e.user_id == ^user_id)
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
