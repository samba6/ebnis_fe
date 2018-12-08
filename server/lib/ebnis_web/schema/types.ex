defmodule EbnisWeb.Schema.Types do
  @moduledoc """
  Custom types (scalars, objects and input types) shared among schema types
  """
  use Absinthe.Schema.Notation
  use Timex

  alias Ebnis.Experiences.DefaultImpl.EctoFieldVal

  @iso_extended_format "{ISO:Extended:Z}"

  scalar :entry_field_json, name: "EntryField" do
    parse(&parse_entry_field/1)

    serialize(fn val ->
      {:ok, data} = EctoFieldVal.serialize_k_v(val)
      Jason.encode!(data)
    end)
  end

  defp parse_entry_field(%Absinthe.Blueprint.Input.String{value: value}) do
    case Jason.decode(value) do
      {:ok, parsed} ->
        EctoFieldVal.parse(parsed)

      {:error, _} ->
        :error
    end
  end

  defp parse_entry_field(%Absinthe.Blueprint.Input.Null{}) do
    {:ok, nil}
  end

  defp parse_entry_field(_) do
    :error
  end

  scalar :iso_datetime, name: "ISODatime" do
    parse(&parse_iso_datetime/1)
    serialize(&Timex.format!(&1, @iso_extended_format))
  end

  @spec parse_iso_datetime(Absinthe.Blueprint.Input.String.t()) ::
          {:ok, DateTime.t() | NaiveDateTime.t()} | :error
  @spec parse_iso_datetime(Absinthe.Blueprint.Input.Null.t()) :: {:ok, nil}
  defp parse_iso_datetime(%Absinthe.Blueprint.Input.String{value: value}) do
    case Timex.parse(value, @iso_extended_format) do
      {:ok, val} -> {:ok, val}
      {:error, _} -> :error
    end
  end

  defp parse_iso_datetime(%Absinthe.Blueprint.Input.Null{}) do
    {:ok, nil}
  end

  defp parse_iso_datetime(_) do
    :error
  end
end
