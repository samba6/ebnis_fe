defmodule EbnisWeb.Resolver.Experience do
  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias EbnisWeb.Resolver
  alias Ebnis.Experiences

  def create(_, %{experience: attrs}, %{context: %{current_user: user}}) do
    case attrs
         |> Map.put(:user_id, user.id)
         |> Experiences.create_experience() do
      {:ok, exp} ->
        {:ok, exp}

      {:error, failed_operation, changeset} ->
        {
          :error,
          Resolver.transaction_errors_to_string(changeset, failed_operation)
        }
    end
  end

  def get_experiences(_, _, _) do
  end

  def fields(%{} = experience, _, %{context: %{loader: loader}}) do
    loader
    |> Dataloader.load(:data, :fields, experience)
    |> on_load(fn loader ->
      fields = Dataloader.get(loader, :data, :fields, experience)

      {:ok, fields}
    end)
  end
end
