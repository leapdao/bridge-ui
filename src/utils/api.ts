/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

class RequestError extends Error {
  public status: any;

  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

type Method = 'get' | 'post' | 'delete' | 'put';

export default apiUrl => (
  method: Method,
  path: string,
  params: {},
  options: { [key: string]: any } = {}
) => {
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
