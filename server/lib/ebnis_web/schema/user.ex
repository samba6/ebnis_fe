defmodule EbnisWeb.Schema.User do
  use Absinthe.Schema.Notation

  alias EbnisWeb.User.Resolver

  @desc "A User"
  object :user do
    field(:id, non_null(:id))
    field(:jwt, non_null(:string))
    field(:email, non_null(:string))
    field(:name, non_null(:string))
    field(:credential, :credential)

    field(:inserted_at, non_null(:iso_datetime))
    field(:updated_at, non_null(:iso_datetime))
  end

  @desc "Variables for creating User and credential"
  input_object :registration do
    field(:name, non_null(:string))
    field(:email, non_null(:string))
    field(:source, non_null(:string))
    field(:password, non_null(:string))
    field(:password_confirmation, non_null(:string))
  end

  @desc "Variables for updating User"
  input_object :update_user do
    field(:jwt, non_null(:string))
    field(:name, :string)
    field(:email, :string)
  end

  @desc "Variables for login in User"
  input_object :login_user do
    field(:password, non_null(:string))
    field(:email, non_null(:string))
  end

  @desc "Input variables for refreshing user"
  input_object :refresh_input do
    field(:jwt, non_null(:string))
  end

  @desc "Mutations allowed on User object"
  object :user_mutation do
    @doc "Create a user and her credential"
    field :registration, :user do
      arg(:registration, non_null(:registration))

      resolve(&Resolver.create/3)
    end

    @doc "Update a user"
    field :update, :user do
      arg(:user, non_null(:update_user))

      resolve(&Resolver.update/3)
    end
  end

  @desc "Queries allowed on User object"
  object :user_query do
    @desc "Refresh a user session"
    field :refresh, :user do
      arg(:refresh, non_null(:refresh_input))
      resolve(&Resolver.refresh/3)
    end

    @doc "Log in a user"
    field :login, :user do
      arg(:login, non_null(:login_user))

      resolve(&Resolver.login/3)
    end
  end
end
