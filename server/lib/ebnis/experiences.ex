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

  def get_exp(id) do
    impl().get_exp(id)
  end

  def get_exp_field_defs(exp_id, user_id) do
    impl().get_exp_field_defs(exp_id, user_id)
  end

  def get_user_exps(user_id) do
    impl().get_user_exps(user_id)
  end

  def create_entry(attrs) do
    impl().create_entry(attrs)
  end

  def get_exp_entries(exp_id, user_id) do
    impl().get_exp_entries(exp_id, user_id)
  end

  def get_entry(id), do: impl().get_entry(id)

  defconstp impl do
    Application.get_env(:ebnis, :experiences_impl, DefaultImpl)
  end
end
