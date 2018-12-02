defmodule Ebnis.Factory.Experience do
  use Ebnis.Factory

  alias Ebnis.Factory
  alias Ebnis.Factory.ExpField, as: ExpFieldFactory
  alias Ebnis.Experiences

  @field_count 1..5

  def insert(attrs) do
    {:ok, exp} =
      attrs
      |> params()
      |> Experiences.create_experience()

    exp
  end

  def params(attrs) do
    all()
    |> Map.merge(attrs)
  end

  def title, do: Sequence.next(Enum.random(["E", "e"]) <> "xperience ")
  def fields, do: Enum.map(@field_count, fn _ -> ExpFieldFactory.params() end)

  def fields(count) when count > 0,
    do: Enum.map(1..count, fn _ -> ExpFieldFactory.params() end)

  defp description do
    case Enum.random(1..3) do
      1 -> nil
      2 -> Faker.Lorem.Shakespeare.En.as_you_like_it()
      3 -> Faker.Lorem.Shakespeare.En.king_richard_iii()
    end
  end

  defp all do
    %{
      title: title(),
      fields: fields(Enum.random(@field_count)),
      description: description()
    }
  end

  def stringify(%{} = attrs) do
    attrs
    |> Factory.reject_attrs()
    |> Enum.map(fn
      {:title, title} ->
        {"title", title}

      {:description, description} ->
        {"description", description}

      {:fields, fields} ->
        {"fields", Enum.map(fields, &ExpFieldFactory.stringify/1)}

      {:user_id, user_id} ->
        {"userId", user_id}
    end)
    |> Enum.into(%{})
  end
end
