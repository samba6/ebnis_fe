defmodule Ebnis.Experiences do
  import Constantizer

  alias Ebnis.Experiences.DefaultImpl

  @behaviour Ebnis.Experiences.Impl

  def create_exp_def(attrs) do
    impl().create_exp_def(attrs)
  end

  def get_exp_def(id, user_id) do
    impl().get_exp_def(id, user_id)
  end

  defconstp impl do
    Application.get_env(:ebnis, :experiences_impl, DefaultImpl)
  end
end
