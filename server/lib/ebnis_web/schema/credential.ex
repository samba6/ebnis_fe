defmodule EbnisWeb.Schema.Credential do
  use Absinthe.Schema.Notation

  @desc "User credential"
  object :credential do
    field(:id, non_null(:id))
    field(:source, :string)
    field(:token, :string)
    field(:user, :user)
    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end
end
