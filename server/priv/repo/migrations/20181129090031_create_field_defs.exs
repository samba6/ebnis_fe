defmodule Ebnis.Repo.Migrations.CreateFieldDefs do
  use Ecto.Migration

  def change do
    # execute("""
    # CREATE TYPE field_t as enum(
    #   'single_line_text'
    #   'multi_line_text'
    #   'integer'
    #   'decimal'
    #   'date'
    #   'datetime'
    # );
    # """)

    create table(:field_types, primary_key: false) do
      add(:text, :citext, null: false)
    end

    unique_index(:field_types, [:text]) |> create()

    execute("""
      insert into field_types(text) values
        ('single_line_text'),
        ('multi_line_text'),
        ('integer'),
        ('decimal'),
        ('date'),
        ('datetime')
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
        references(
          :field_types,
          on_delete: :delete_all,
          column: :text,
          type: :citext
        ),
        null: false,
        comment: "data type e.g single_line_text, integer etc"
      )
    end

    index(:field_defs, [:exp_def_id]) |> create()
    unique_index(:field_defs, [:id, :type]) |> create()
    unique_index(:field_defs, [:exp_def_id, :name]) |> create()
  end
end
