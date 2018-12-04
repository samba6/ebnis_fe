defmodule Ebnis.Experiences do
  import Constantizer

  alias Ebnis.Experiences.DefaultImpl

  @behaviour Ebnis.Experiences.Impl

  def create_experience(attrs) do
    impl().create_experience(attrs)
  end

  def get_experience(id, user_id) do
    impl().get_experience(id, user_id)
  end

  defconstp impl do
    Application.get_env(:ebnis, :experiences_impl, DefaultImpl)
  end
end
