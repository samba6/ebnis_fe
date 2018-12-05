defmodule EbnisWeb.Resolver.ExpDef do
  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias EbnisWeb.Resolver
  alias Ebnis.Experiences

  def create(_, %{exp_def: attrs}, %{context: %{current_user: user}}) do
    case attrs
         |> Map.put(:user_id, user.id)
         |> Experiences.create_exp_def() do
      {:ok, exp} ->
        {:ok, exp}

      {:error, failed_operation, changeset} ->
        {
          :error,
          Resolver.transaction_errors_to_string(changeset, failed_operation)
        }
    end
  end

  def get_exp(_, %{exp_def: %{id: id}}, %{context: %{current_user: user}}) do
    case Experiences.get_exp_def(id, user.id) do
      nil ->
        {:error, "Experience definition not found"}

      exp ->
        {:ok, exp}
    end
  end

  def get_exp(_, _, _) do
    {:error, Resolver.unauthorized()}
  end

  def get_exps(_, _, _) do
  end

  def field_defs(%{} = exp_def, _, %{context: %{loader: loader}}) do
    loader
    |> Dataloader.load(:data, :field_defs, exp_def)
    |> on_load(fn loader ->
      field_defs = Dataloader.get(loader, :data, :field_defs, exp_def)

      {:ok, field_defs}
    end)
  end
end
