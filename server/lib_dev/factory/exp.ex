defmodule Ebnis.Factory.Exp do
  alias Ebnis.Factory
  alias Ebnis.Experiences.DefaultImpl.ExpDef

  @integers 0..1_000

  def stringify(%{} = attrs) do
    attrs
    |> Factory.reject_attrs()
    |> Enum.map(fn
      {:entries, defs} ->
        {"entries", Enum.map(defs, &to_string/1)}

      {k, v} when k in [nil] ->
        {Factory.to_camel_key(k), v}
    end)
    |> Enum.into(%{})
  end

  def params(%ExpDef{field_defs: field_defs, id: exp_def_id}) do
    entries =
      Enum.map(field_defs, fn %{id: id, type: type} ->
        %{
          def_id: id,
          data: Map.new([{type, data(type)}])
        }
      end)

    %{
      entries: entries,
      def_id: exp_def_id,
      field_def_ids: Enum.map(field_defs, & &1.id)
    }
  end

  defp data("integer"), do: Enum.random(@integers)
  defp data("date"), do: Factory.random_date()
  defp data("datetime"), do: Factory.random_datetime()
  defp data("multi_line_text"), do: Faker.Lorem.Shakespeare.En.hamlet()

  defp data("single_line_text"),
    do: Faker.Lorem.Shakespeare.En.as_you_like_it()

  defp data("decimal"),
    do: "#{Enum.random(@integers)}.#{Enum.random(@integers)}"
end
