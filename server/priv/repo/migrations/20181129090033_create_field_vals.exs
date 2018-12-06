defmodule Ebnis.Repo.Migrations.CreateFieldVals do
  use Ecto.Migration

  def change do
    create table(:field_vals) do
      add(
        :exp_id,
        references(:exps, on_delete: :delete_all),
        null: false,
        comment: "Experience to which the field value belongs"
      )

      add(
        :def_id,
        :integer,
        null: false,
        comment: "Field to which the value belongs"
      )

      add(
        :type,
        :citext,
        null: false,
        comment: "Field type of the value belongs"
      )

      # COLUMNS THAT HOLD FIELD VALUES

      add(:value, :map, null: false, comment: "Single like text field")
    end

    index(:field_vals, [:exp_id]) |> create()

    unique_index(:field_vals, [:exp_id, :def_id]) |> create()

    execute("""
    ALTER TABLE field_vals
    ADD CONSTRAINT "field_vals_def_id_type_fkey"
    FOREIGN KEY (def_id, type) REFERENCES field_defs(id, type)
    ON DELETE CASCADE
    """)
  end
end
