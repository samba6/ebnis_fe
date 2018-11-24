defmodule Ebnis.Query.Registration do
  alias EbnisWeb.Query.Credential
  alias EbnisWeb.Query.User

  @doc "Register"
  def register do
    {user_frag_name, user_frag} = User.all_fields_fragment()
    {credential_frag_name, credential_frag} = Credential.all_fields_fragment()

    query = """
        registration(registration: $registration) {
          ...#{user_frag_name}

          credential {
            ...#{credential_frag_name}
          }
        }
    """

    %{
      query: query,
      fragments: ~s( #{credential_frag} #{user_frag} ),
      parameters: "$registration: Registration!"
    }
  end

  @doc "Login"
  def login do
    {user_frag_name, user_frag} = User.all_fields_fragment()

    query = """
        login(login: $login) {
          ...#{user_frag_name}
        }
    """

    %{
      query: query,
      fragments: ~s(  #{user_frag} ),
      parameters: "$login: LoginUser!"
    }
  end
end
