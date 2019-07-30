export const getBackendUrls = (uri?: string) => {
  const apiUrl = uri || process.env.API_URL;

  if (!apiUrl) {
    throw new Error('You must set the "API_URL" environment variable');
  }

  const url = new URL(apiUrl);

  return {
    apiUrl: url.href,
    websocketUrl: url.href.replace("http", "ws").replace(/\/?$/, "/socket"),
    root: url.origin,
  };
};
