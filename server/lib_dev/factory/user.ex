defmodule Ebnis.Factory.User do
  use Ebnis.Factory

  alias Ebnis.Factory

  @simple_attrs [:name, :email, :jwt ]

  @doc false
  def insert(_), do: nil

  def params(%{} = attrs) do
    all()
    |> Map.merge(attrs)
  end

  def stringify(%{} = params),
    do:
      params
      |> Factory.reject_attrs()
      |> Enum.map(fn
        {k, v} when k in @simple_attrs ->
          {Factory.to_camel_key(k), v}

        _ ->
          nil
      end)
      |> Enum.reject(&(&1 == nil))
      |> Enum.into(%{})

  defp all do
    %{
      name: Faker.Name.first_name(),
      email: Faker.Internet.email()
    }
  end
end
