defmodule EbnisWeb.Schema do
  use Absinthe.Schema

  import_types(Absinthe.Type.Custom)
  import_types(EbnisWeb.Schema.Types)
  import_types(EbnisWeb.Schema.Credential)
  import_types(EbnisWeb.Schema.User)

  query do
    import_fields(:user_query)
  end

  mutation do
    import_fields(:user_mutation)
  end

  def context(ctx) do
    loader =
      Dataloader.new()
      |> Dataloader.add_source(
        :data,
        Dataloader.Ecto.new(Ebnis.Repo, query: &my_data/2)
      )

    Map.put(ctx, :loader, loader)
  end

  def plugins do
    [Absinthe.Middleware.Dataloader] ++ Absinthe.Plugin.defaults()
  end

  def my_data(queryable, _params) do
    queryable
  end
end
