export const onPreRenderHTML = ({
  getHeadComponents,
  pathname,
  replaceHeadComponents,
}) => {
  if (
    ![
      `/offline-plugin-app-shell-fallback/`,
      `/offline-plugin-app-shell-fallback/index.html`,
    ].includes(pathname)
  )
    return;

  const headComponents = getHeadComponents();

  const filteredHeadComponents = headComponents.filter(
    ({ type, props }) =>
      !(
        type === `link` &&
        props.as === `fetch` &&
        props.rel === `preload` &&
        (props.href.startsWith(`/static/d/`) ||
          props.href.startsWith(`/page-data/`))
      ),
  );

  replaceHeadComponents(filteredHeadComponents);
};
