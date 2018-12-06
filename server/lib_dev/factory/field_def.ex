defmodule Ebnis.Factory.FieldDef do
  use Ebnis.Factory

  @field_types [
    "single_line_text",
    "multi_line_text",
    "integer",
    "decimal",
    "date",
    "datetime"
  ]

  def insert(_attrs), do: nil

  def params(attrs) do
    all()
    |> Map.merge(attrs)
  end

  defp all do
    %{
      name: Enum.random(["F", "f"]) <> "ield " <> Sequence.next(""),
      type: Enum.random(@field_types)
    }
  end

  def stringify(field) do
    Enum.map(field, fn
      {:type, v} ->
        {"type", String.upcase(v)}

      {:name, v} ->
        {"name", v}
    end)
    |> Enum.into(%{})
  end
end
