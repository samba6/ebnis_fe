// istanbul ignore next
export function scrollToTop(dom: HTMLElement | null) {
  if (dom) {
    dom.scrollTop = 0;
  }
}
