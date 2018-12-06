defmodule Ebnis.Factory.FieldVal do
  alias Ebnis.Factory
  alias Ebnis.Experiences.DefaultImpl.FieldDef

  @field_types [
    :single_line_text,
    :multi_line_text,
    :integer,
    :decimal,
    :date,
    :datetime
  ]

  @assoc_fields [:exp_id, :def_id]

  @integers 1..1_000

  def insert(_), do: nil

  def params(%FieldDef{} = fdef), do: params(fdef, %{})

  def params(%FieldDef{} = fdef, attrs) when is_list(attrs) do
    params(fdef, Map.new(attrs))
  end

  def params(%FieldDef{} = fdef, attrs) do
    Map.merge(all(fdef), attrs)
  end

  defp all(%{type: type} = fdef) when is_binary(type) do
    %{fdef | type: String.to_existing_atom(type)} |> all()
  end

  defp all(%{id: def_id, type: type}) do
    value = Map.new([{type, value(type)}])
    Map.new([{:def_id, def_id}, {:value, value}])
  end

  defp value(:single_line_text), do: Faker.Lorem.Shakespeare.En.hamlet()
  defp value(:multi_line_text), do: Faker.Lorem.Shakespeare.En.hamlet()
  defp value(:integer), do: Enum.random(@integers)
  defp value(:date), do: Factory.random_date()
  defp value(:datetime), do: Factory.random_datetime()

  defp value(:decimal),
    do:
      "#{Enum.random(@integers)}.#{Enum.random(@integers)}"
      |> String.to_float()

  def stringify(attrs) do
    attrs
    |> Enum.reduce(%{}, fn
      {_k, %Date{} = v}, acc ->
        Map.put(acc, "DATE", Date.to_iso8601(v))

      {_k, %DateTime{} = v}, acc ->
        Map.put(acc, "DATETIME", DateTime.to_iso8601(v))

      {k, v}, acc when k in @field_types ->
        Map.put(acc, Factory.to_camel_key(k) |> String.upcase(), v)

      {k, v}, acc when k in @assoc_fields ->
        Map.put(acc, Factory.to_camel_key(k), v)

      _, acc ->
        acc
    end)
  end
end
