defmodule Ebnis.Experiences do
  import Constantizer

  alias Ebnis.Experiences.DefaultImpl

  @behaviour Ebnis.Experiences.Impl

  def create_exp(attrs) do
    impl().create_exp(attrs)
  end

  def get_exp(id, user_id) do
    impl().get_exp(id, user_id)
  end

  def get_exps(user_id) do
    impl().get_exps(user_id)
  end

  defconstp impl do
    Application.get_env(:ebnis, :experiences_impl, DefaultImpl)
  end
end
