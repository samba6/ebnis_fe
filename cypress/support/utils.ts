import { Registration } from "../../src/graphql/apollo-types/globalTypes";

export const USER_JWT_ENV = "USER_JWT";

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

export const USER_REGISTRATION_OBJECT: Registration = {
  email: "a@b.com",
  name: "a@b.com",
  password: "a@b.com",
  passwordConfirmation: "a@b.com",
  source: "password"
};

/**
 * Given a Jquery object, get a node that matches exactly the given text
 *
 * @param {$node} JQuery<HTMLElement>
 * @param {text} string
 * @returns null | HTMLElement | JQuery<HTMLElement>
 */
export function getDescendantByText($node: JQuery<HTMLElement>, text: string) {
  const $directChild = $node.children(`:contains("${text}")`).first();

  // if we find the text in any of the direct children we are ok
  if ($directChild.text() === text) {
    return $directChild;
  }

  let $children = $directChild.children();

  // it means we did not find the text any where in this node
  if ($children.length === 0) {
    return null;
  }

  let index = 0;

  while (true) {
    const descendant = $children[index];

    // we ran out of descendants - we exit the loop
    if (!descendant) {
      return null;
    }

    const { textContent } = descendant;

    // the text is no where in this guy or its child, we'll try next sibling
    if (!textContent) {
      ++index;
      continue;
    }

    // we found the text, ok
    if (textContent === text) {
      return descendant;
    }

    // the text is in this guy's child, so we ignore it's siblings
    if (textContent.includes(text)) {
      $children = $(descendant).children();
      index = 0;
    }
    // well let's try the next sibling
    else {
      ++index;
    }
  }
}
