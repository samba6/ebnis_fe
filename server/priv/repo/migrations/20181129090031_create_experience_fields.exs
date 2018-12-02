defmodule Ebnis.Repo.Migrations.CreateExperienceFields do
  use Ecto.Migration

  def change do
    create table(:exp_fields) do
      add(
        :experience_id,
        references(:experiences, on_delete: :delete_all),
        null: false,
        comment: "Experience to which the field belongs"
      )

      add(:name, :citext, null: false, comment: "E.g sleep")

      add(
        :type,
        :citext,
        null: false,
        comment: "data type e.g single_line_text, integer etc"
      )

      # FIELD TYPES OF EXPERIENCE

      add(:single_line_text, :string, comment: "Single like text field")
      add(:multi_line_text, :text, comment: "Multi line text field")
      add(:integer, :integer)
      add(:decimal, :float)
      add(:date, :date)
      add(:datetime, :utc_datetime)
    end

    :exp_fields
    |> index([:experience_id])
    |> create()

    :exp_fields
    |> unique_index([:experience_id, :name])
    |> create()
  end
end
