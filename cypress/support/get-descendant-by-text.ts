/**
 * Given a Jquery object, get a node that matches exactly the given text
 *
 * @param {$node} HTMLElement
 * @param {text} string
 * @returns {null | HTMLElement}
 */
export function getDescendantByText(text: string, $node?: JQuery<HTMLElement>) {
  const lowerText = text.toLowerCase();

  if ($node) {
    // if we find the text in the node itself, then all is ok

    const $$node = $node[0];
    if (
      $$node.firstChild.nodeType === $$node.TEXT_NODE &&
      $$node.textContent.toLowerCase() === lowerText
    ) {
      return $node;
    }
  } else {
    $node = Cypress.$("body");
  }

  let $children = $node.children() as (
    | JQuery<HTMLElement>
    | NodeListOf<HTMLElement>);

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

    let textContent = descendant.textContent;

    // the text is no where in this guy or its child, we'll try next sibling
    if (!textContent) {
      ++index;
      continue;
    }

    textContent = textContent.toLowerCase();

    // we found the text
    if (textContent === lowerText) {
      // the text we are looking for is the first child of the element
      if (
        (descendant.firstChild as HTMLElement).nodeType === descendant.TEXT_NODE
      ) {
        return descendant;
      }

      // then the text we are looking for is inside one of the element's
      // children
      $children = descendant.childNodes as NodeListOf<HTMLElement>;
      index = 0;
    }

    // the text is in this guy's child, so we ignore it's siblings
    if (textContent.includes(lowerText)) {
      $children = descendant.childNodes as NodeListOf<HTMLElement>;
      index = 0;
    }
    // well let's try the next sibling
    else {
      ++index;
    }
  }
}
