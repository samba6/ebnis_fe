defmodule EbnisWeb.Auth.Guardian do
  use Guardian, otp_app: :ebnis

  alias Ebnis.Accounts.Users

  def subject_for_token(%{id: id} = _resource, _claims) do
    # You can use any value for the subject of your token but
    # it should be useful in retrieving the resource later, see
    # how it being used on `resource_from_claims/1` function.
    # A unique `id` is a good subject, a non-unique email address
    # is a poor subject.
    sub = to_string(id)
    {:ok, sub}
  end

  def subject_for_token(_, _) do
    {:error, :invalid_resource}
  end

  def resource_from_claims(%{"sub" => id} = _claims) do
    # Here we'll look up our resource from the claims, the subject can be
    # found in the `"sub"` key. In `above subject_for_token/2` we returned
    # the resource id so here we'll rely on that to look it up.

    case Users.get(id) do
      nil ->
        {:error, :non_existent_user}

      user ->
        {:ok, user}
    end
  end

  def resource_from_claims(_claims) do
    {:error, :unable_to_load_resource}
  end

  def auth_error(conn, {type, _reason}, _opts) do
    body = Poison.encode!(%{message: to_string(type)})
    Plug.Conn.send_resp(conn, 401, body)
  end
end
