export interface UserCreationObject {
  email: string;
  name: string;
  password: string;
  password_confirmation: string;
  source: string;
}

export const USER_CREATION_OBJECT: UserCreationObject = {
  email: "a@b.com",
  name: "a@b.com",
  password: "a@b.com",
  password_confirmation: "a@b.com",
  source: "password"
};
