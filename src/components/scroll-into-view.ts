const ID_PREFIX = "js-scroll-into-view-";

export function makeScrollIntoViewId(id: string) {
  return ID_PREFIX + id;
}

export function scrollIntoView(id: string, options?: ScrollIntoViewOptions) {
  const $element = document.getElementById(id);

  if (!$element) {
    return;
  }

  if (!$element.scrollIntoView) {
    window.location.href = window.location.pathname + `#${id}`;
    return;
  }

  $element.scrollIntoView(options);
}
