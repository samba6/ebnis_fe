const URL_ROOT = "/";
const URL_SOCKET = "/socket";

export const getBackendUrls = () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  if (!apiUrl) {
    throw new Error(
      'You must set the "REACT_APP_API_URL" environment variable'
    );
  }

  let websocketUrl;

  // if we are in production, we connect directly to the socket using absolute
  //  uri
  if (apiUrl === URL_ROOT) {
    websocketUrl = URL_SOCKET;
  } else {
    const httpHostRegexExec = /https?/.exec(apiUrl);

    if (!httpHostRegexExec) {
      throw new Error("Invalid HTTP host in '" + apiUrl + "'");
    }

    const httpHost = httpHostRegexExec[0];
    const websocketHost = httpHost === "https" ? "wss" : "ws";

    websocketUrl = apiUrl.replace(httpHost, websocketHost) + URL_SOCKET;
  }

  return {
    apiUrl,
    websocketUrl
  };
};

export default getBackendUrls;
