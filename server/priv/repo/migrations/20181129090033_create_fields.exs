defmodule Ebnis.Repo.Migrations.CreateFields do
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
        :field_def_id,
        references(:field_defs, on_delete: :delete_all),
        null: false,
        comment: "Experience to which the field value belongs"
      )

      # COLUMNS THAT HOLD FIELD VALUES

      add(:single_line_text, :string, comment: "Single like text field")
      add(:multi_line_text, :text, comment: "Multi line text field")
      add(:integer, :integer)
      add(:decimal, :float)
      add(:date, :date)
      add(:datetime, :utc_datetime)
    end

    index(:field_vals, [:exp_id]) |> create()

    index(:field_vals, [:field_def_id]) |> create()

    constraint(
      :field_vals,
      :one_value_column_non_null,
      check: """
      (CASE WHEN single_line_text IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN multi_line_text IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN integer IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN decimal IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN date IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN datetime IS NULL THEN 0 ELSE 1 END) = 1
      """
    )
    |> create()
  end
end
