defmodule Ebnis.Factory.ExpDef do
  use Ebnis.Factory

  alias Ebnis.Factory
  alias Ebnis.Factory.FieldDef, as: FieldDefFactory
  alias Ebnis.Experiences

  @count 1..5

  @simple_attrs [:user_id, :title, :description]

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
        {"fieldDefs", Enum.map(defs, &FieldDefFactory.stringify/1)}

      {k, v} when k in @simple_attrs ->
        {Factory.to_camel_key(k), v}
    end)
    |> Enum.into(%{})
  end
end
