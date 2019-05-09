const URL_SOCKET = "/socket";

export const getBackendUrls = (uri?: string) => {
  const apiUrl = uri || process.env.API_URL;

  if (!apiUrl) {
    throw new Error('You must set the "API_URL" environment variable');
  }

  const url = new URL(apiUrl);

  return {
    apiUrl: url.href,
    websocketUrl: new URL(URL_SOCKET, url.origin).href.replace("http", "ws"),
    root: url.origin
  };
};
