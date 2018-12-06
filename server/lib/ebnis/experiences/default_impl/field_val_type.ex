defmodule Ebnis.Experiences.DefaultImpl.EctoFieldVal do
  @behaviour Ecto.Type

  @iso_extended_format "{ISO:Extended:Z}"
  @text_types [
    "single_line_text",
    "multi_line_text",
    :single_line_text,
    :multi_line_text
  ]

  def type, do: :map

  def cast(%{"integer" => val}) do
    cast(%{integer: val})
  end

  def cast(%{integer: val}) when is_integer(val), do: {:ok, val}

  def cast(%{integer: val}) do
    try do
      {:ok, %{"integer" => String.to_integer(val)}}
    rescue
      _ ->
        :error
    end
  end

  def cast(%{"decimal" => val}), do: cast(%{decimal: val})

  def cast(%{decimal: val}) when is_float(val) or is_integer(val),
    do: {:ok, val}

  def cast(%{decimal: val}) do
    try do
      {:ok, %{"decimal" => String.to_float(val)}}
    rescue
      _ ->
        :error
    end
  end

  def cast(%{"date" => val}), do: cast(%{date: val})
  def cast(%{date: %Date{} = val}), do: {:ok, val}

  def cast(%{date: val}) do
    case Date.from_iso8601(val) do
      {:ok, date} ->
        {:ok, date}

      _ ->
        :error
    end
  end

  def cast(%{"datetime" => val}), do: cast(%{datetime: val})
  def cast(%{datetime: %DateTime{} = val}), do: {:ok, %{"datetime" => val}}

  def cast(%{datetime: val}) do
    case Timex.parse(val, @iso_extended_format) do
      {:ok, val} ->
        {:ok, %{"datetime" => val}}

      _ ->
        :error
    end
  end

  def cast(%{} = val) do
    case Map.to_list(val) do
      [{k, v}] when k in @text_types and is_binary(v) ->
        {:ok, v}

      _ ->
        :error
    end
  end

  def cast(_), do: :error

  def load(val) when is_map(val), do: cast(val)

  def dump(val) when is_map(val) do
    case cast(val) do
      {:ok, _} ->
        {:ok, val}

      _ ->
        :error
    end
  end

  def dump(_), do: :error
end
