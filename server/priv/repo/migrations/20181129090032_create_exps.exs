defmodule Ebnis.Repo.Migrations.CreateExps do
  use Ecto.Migration

  def change do
    create table(:exps) do
      add(
        :exp_def_id,
        references(:exp_defs, on_delete: :delete_all),
        null: false,
        comment: "Experience to which the field belongs"
      )

      timestamps(type: :utc_datetime)
    end

    :exps
    |> index([:exp_def_id])
    |> create()
  end
end
