defmodule Ebnis.HoundCase do
  @moduledoc """
  This module defines the setup for tests requiring
  access to the application's data layer.

  You may define functions here to be used as helpers in
  your tests.

  Finally, if the test case interacts with the database,
  it cannot be async. For this reason, every test runs
  inside a transaction which is reset at the beginning
  of the test unless the test case is marked as async.
  """

  use ExUnit.CaseTemplate

  @test_path "http://localhost:4024"
  @root_path "\\"

  using do
    quote do
      use Hound.Helpers

      alias Ebnis.Repo

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import Ebnis.HoundCase
    end
  end

  setup tags do
    alias Ebnis.Repo

    parent = self()
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)

    # always use shared mode i.e. no concurrency because hound crashes on
    # on async true in `use ExUnit.Case, async: true`
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, parent})

    metadata = Phoenix.Ecto.SQL.Sandbox.metadata_for(Repo, parent)

    hound_meta_data =
      Hound.Browser.user_agent(:chrome)
      |> Hound.Metadata.append(metadata)

    chrome_args = [
      "--user-agent=#{hound_meta_data}"
      # "--disable-gpu"
      # "--port=4024"
    ]

    chrome_args =
      unless tags[:no_headless] do
        ["--headless" | chrome_args]
      else
        chrome_args
      end

    Hound.start_session(
      metadata: metadata,
      additional_capabilities: %{
        chromeOptions: %{"args" => chrome_args}
      }
    )

    on_exit(fn ->
      Hound.end_session(parent)

      # System.cmd("taskkill", [
      #   "/im",
      #   "chromedriver.exe",
      #   "/t",
      #   "/F"
      # ])
    end)

    :ok
  end

  @doc """
  A helper that transforms changeset errors into a map of messages.

      assert {:error, changeset} = Accounts.create_user(%{password: "short"})
      assert "password is too short" in errors_on(changeset).password
      assert %{password: ["password is too short"]} = errors_on(changeset)

  """
  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  @spec path(binary()) :: <<_::64, _::_*8>>
  def path(path \\ @root_path), do: @test_path <> path

  @doc ~S"""
    Checks if fun.() == condition until truthy or we have checked retries
    times.
  """
  @spec retries(
          condition :: boolean,
          fun :: fun,
          retries :: integer()
        ) :: boolean
  def retries(condition, fun, retries \\ 20) do
    retries(condition, condition == fun.(), fun, retries - 1)
  end

  defp retries(condition, condition, _, _), do: condition
  defp retries(_, new_cond, _, 0), do: new_cond

  defp retries(condition, _, fun, retries) do
    retries(condition, condition == fun.(), fun, retries - 1)
  end
end
