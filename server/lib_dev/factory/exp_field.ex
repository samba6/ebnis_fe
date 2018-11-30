defmodule Ebnis.Factory.ExpField do
  use Ebnis.Factory

  alias Ebnis.Factory

  @simple_attrs [
    :single_line_text,
    :multi_line_text,
    :integer,
    :decimal,
    :date,
    :datetime
  ]

  @integers 0..1_000_000
  @whole_numbers 0..1_000

  def insert(attrs) do
    attrs
    |> params()
  end

  def params(attrs) do
    all()
    |> Map.merge(attrs)
  end

  defp all do
    field = Enum.random(@simple_attrs)

    %{
      name: Enum.random(["F", "f"]) <> "ield " <> Sequence.next("")
    }
    |> Map.put(field, field(field))
  end

  defp field(:single_line_text), do: Faker.Lorem.sentence()
  defp field(:multi_line_text), do: Faker.Lorem.paragraph()
  defp field(:integer), do: Enum.random(@integers)
  defp field(:date), do: Factory.random_date()
  defp field(:datetime), do: Factory.random_datetime()

  defp field(:decimal) do
    whole = Enum.random(@whole_numbers)
    fraction = Enum.random(@whole_numbers)
    String.to_float("#{whole}.#{fraction}")
  end

  def stringify(%{datetime: %DateTime{} = d, name: name}) do
    %{"type" => "DATETIME", "value" => DateTime.to_iso8601(d), "name" => name}
  end

  def stringify(%{date: %Date{} = d, name: name}) do
    %{"type" => "DATE", "value" => Date.to_iso8601(d), "name" => name}
  end

  def stringify(%{type: type} = field) do
    stringify(field.name, type, field[:value])
  end

  def stringify(field) do
    [{k, v}] =
      field
      |> Map.delete(:name)
      |> Map.to_list()

    stringify(field.name, k, v)
  end

  defp stringify(name, type, value) do
    type =
      type
      |> Atom.to_string()
      |> String.upcase()

    field = %{
      "name" => name,
      "type" => type
    }

    if value, do: Map.put(field, "value", to_string(value)), else: field
  end
end
