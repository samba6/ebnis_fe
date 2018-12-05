defmodule Ebnis.Repo.Migrations.CreateFieldDefs do
  use Ecto.Migration

  def change do
    execute("""
    CREATE TYPE field_t as enum(
      'single_line_text'
      'multi_line_text'
      'integer'
      'decimal'
      'date'
      'datetime'
    );
    """)

    create table(:field_defs) do
      add(
        :exp_def_id,
        references(:exp_defs, on_delete: :delete_all),
        null: false,
        comment: "Experience definition to which the field belongs"
      )

      add(:name, :citext, null: false, comment: "E.g sleep start, sleep end")

      add(
        :type,
        :field_t,
        null: false,
        comment: "data type e.g single_line_text, integer etc"
      )
    end

    :field_defs
    |> index([:exp_def_id])
    |> create()

    :field_defs
    |> unique_index([:exp_def_id, :name])
    |> create()
  end
end
