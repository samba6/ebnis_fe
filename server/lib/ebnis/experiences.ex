defmodule Ebnis.Experiences do
  import Constantizer

  alias Ebnis.Experiences.DefaultImpl

  @behaviour Ebnis.Experiences.Impl

  def create_experience(attrs) do
    impl().create_experience(attrs)
  end

  defconstp impl do
    Application.get_env(:ebnis, :experiences_impl, DefaultImpl)
  end
end
