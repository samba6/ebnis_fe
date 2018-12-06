defmodule Ebnis.Factory.ExpDef do
  use Ebnis.Factory

  alias Ebnis.Factory
  alias Ebnis.Factory.FieldDef, as: FieldDefFactory
  alias Ebnis.Experiences
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  @count 1..5
  @simple_attrs [:user_id, :title, :description]
  @integers 0..1_000

  def insert(attrs) do
    {:ok, exp} =
      attrs
      |> params()
      |> Experiences.create_exp_def()

    exp
  end

  def params(attrs) do
    all()
    |> Map.merge(attrs)
  end

  defp description do
    case Enum.random(1..3) do
      1 -> nil
      2 -> Faker.Lorem.Shakespeare.En.as_you_like_it()
      3 -> Faker.Lorem.Shakespeare.En.king_richard_iii()
    end
  end

  defp all do
    %{
      title: Sequence.next(Enum.random(["E", "e"]) <> "xperience "),
      field_defs:
        1..Enum.random(@count)
        |> Enum.map(fn _ -> FieldDefFactory.params() end),
      description: description()
    }
  end

  def stringify(%{} = attrs) do
    attrs
    |> Factory.reject_attrs()
    |> Enum.map(fn
      {:field_defs, defs} ->
        {"field_defs", Enum.map(defs, &FieldDefFactory.stringify/1)}

      {k, v} when k in @simple_attrs ->
        {Factory.to_camel_key(k), v}
    end)
    |> Enum.into(%{})
  end

  def entry(%ExpDef{field_defs: field_defs}) do
    fields =
      Enum.map(field_defs, fn %{id: id, type: type} ->
        %{
          def_id: id,
          value: Map.new([{type, entry_val(type)}])
        }
      end)

    %{fields: fields}
  end

  defp entry_val("integer"), do: Enum.random(@integers)
  defp entry_val("date"), do: Factory.random_date()
  defp entry_val("datetime"), do: Factory.random_datetime()
  defp entry_val("multi_line_text"), do: Faker.Lorem.Shakespeare.En.hamlet()

  defp entry_val("single_line_text"),
    do: Faker.Lorem.Shakespeare.En.as_you_like_it()

  defp entry_val("decimal"),
    do: "#{Enum.random(@integers)}.#{Enum.random(@integers)}"
end
