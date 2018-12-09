defmodule Ebnis.Experiences.DefaultImpl.EctoFieldVal do
  @behaviour Ecto.Type

  @iso_extended_format "{ISO:Extended:Z}"

  @all_types_string [
    "single_line_text",
    "multi_line_text",
    "integer",
    "decimal",
    "date",
    "datetime"
  ]

  @string_types [
    "single_line_text",
    "multi_line_text",
    :multi_line_text,
    :single_line_text
  ]

  @integer_types ["integer", :integer]
  @decimal_types ["decimal", :decimal]
  @date_type ["date", :date]
  @datetime_type ["datetime", :datetime]
  @all_types_atom Enum.map(@all_types_string, &String.to_existing_atom/1)
  @all_types Enum.concat(@all_types_string, @all_types_atom)
  @non_primitives ["datetime", "date", :datetime, :date]
  @primitives Enum.reject(@all_types, &Enum.member?(@non_primitives, &1))

  @float_string_pattern ~r|^\d+\.?$|

  @doc ~S"""
  Turn both key and value to map only so we get:
  %{"date" => "2015-01-10" }
  """

  def serialize_k_v(%{} = val) do
    [{k, v}] = Map.to_list(val)

    serialize_k_v(k, v)
  end

  def serialize_k_v(_), do: :error

  defp serialize_k_v(k, v) when k in @integer_types and is_integer(v) do
    to_map(k, v)
  end

  defp serialize_k_v(k, v) when k in @integer_types and is_binary(v) do
    parse_serialize(k, v)
  end

  defp serialize_k_v(k, v) when k in @decimal_types and (is_float(v) or is_integer(v)) do
    to_map(k, v / 1)
  end

  defp serialize_k_v(k, v) when k in @decimal_types and is_binary(v) do
    parse_serialize(k, v)
  end

  defp serialize_k_v(k, v) when k in @string_types and is_binary(v) do
    to_map(k, v)
  end

  defp serialize_k_v(key, %Date{} = date) when key in @date_type do
    to_map(key, Date.to_iso8601(date))
  end

  defp serialize_k_v(k, v) when k in @date_type and is_binary(v) do
    parse_serialize(k, v)
  end

  defp serialize_k_v(key, %DateTime{} = val) when key in @datetime_type do
    to_map(key, DateTime.to_iso8601(val))
  end

  defp serialize_k_v(k, v) when k in @datetime_type and is_binary(v) do
    parse_serialize(k, v)
  end

  defp serialize_k_v(_, _), do: :error

  defp parse_serialize(k, v) do
    with {:ok, _} <- parse(k, v), do: to_map(k, v)
  end

  def parse(%{} = val) do
    [{k, v}] = Map.to_list(val)

    parse(k, v)
  end

  defp parse(key, val) when key in @string_types and is_binary(val) do
    to_map(key, val)
  end

  defp parse(k, val) when k in @integer_types and is_integer(val) do
    to_map(k, val)
  end

  defp parse(k, val) when k in @integer_types and is_binary(val) do
    try do
      to_map(k, String.to_integer(val))
    rescue
      _ ->
        :error
    end
  end

  defp parse(k, v) when k in @decimal_types and (is_float(v) or is_integer(v)) do
    to_map(k, v / 1)
  end

  defp parse(k, v) when k in @decimal_types and is_binary(v) do
    v =
      case Regex.match?(@float_string_pattern, v) do
        true ->
          String.replace(v, ".", "") <> ".0"

        _ ->
          v
      end

    try do
      to_map(k, String.to_float(v))
    rescue
      _ ->
        :error
    end
  end

  defp parse(k, %Date{} = v) when k in @date_type, do: to_map(k, v)

  defp parse(k, v) when k in @date_type and is_binary(v) do
    case Date.from_iso8601(v) do
      {:ok, v} ->
        to_map(k, v)

      _ ->
        :error
    end
  end

  defp parse(k, %DateTime{} = v) when k in @datetime_type,
    do: to_map(k, v)

  defp parse(k, val) when k in @datetime_type and is_binary(val) do
    case Timex.parse(val, @iso_extended_format) do
      {:ok, v} ->
        to_map(k, v)

      _ ->
        :error
    end
  end

  defp parse(_, _), do: :error

  defp to_map(key, val) when is_atom(key),
    do: to_map(Atom.to_string(key), val)

  defp to_map(key, val) when is_binary(key) do
    {:ok, Map.put(%{}, key, val)}
  end

  def all_types, do: @all_types

  def all_types_string, do: @all_types_string
  def primitives, do: @primitives

  ##################### @behaviour Ecto.Type  ##############################

  def type, do: :map

  def cast(data), do: parse(data)

  def load(val) when is_map(val), do: parse(val)

  def dump(val), do: parse(val)
end
