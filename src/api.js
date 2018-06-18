class RequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export default apiUrl => (method, path, params, options = {}) => {
  options.method = method;
  options.headers = Object.assign(
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    options.headers || {}
  );

  if (params) {
    options.body = JSON.stringify(params);
  }

  return fetch(`${apiUrl}/${path}`, options).then(response => {
    if (response.status >= 200 && response.status < 300) {
      return response.json();
    }

    return response.json().then(json => {
      throw new RequestError(json.errorMessage, response.status);
    });
  });
};
