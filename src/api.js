function isString(str) {
  return typeof str == 'string';
}

function isFunction(func) {
  return typeof func == 'function';
}

function logError(message) {
  throw new Error(`redux-api-middleware: ${message}`);
}

const defaults = {
  actionTypes: {
    start: 'API_REQUEST_START',
    end: 'API_REQUEST_END',
    failure: 'API_REQUEST_FAILURE',
  },
  requestDefaults: {},
};

export function createApiMiddleware(request, options = {}) {
  if (!request) {
    logError(
      'Missing a request object as the first argument. Try passing `fetch` or `axios`'
    );
  }
  const opts = Object.assign({}, defaults, options);

  return function apiMiddleware({dispatch}) {
    return next => action => {
      if (!action.API) {
        return next(action);
      }

      const {
        payload: {type, url, onSuccess, onFailure, ...restConfig},
      } = action.API;

      if (type) {
        dispatch({
          type: opts.actionTypes.start,
          payload: type,
        });
      }

      const requestOptions = Object.assign(
        {},
        options.requestDefaults,
        restConfig
      );

      return request(url, requestOptions)
        .then(res => {
          if (isFunction(res.json)) {
            return res.json();
          }
          return res;
        })
        .then(
          res => {
            if (isFunction(onSuccess)) {
              dispatch(onSuccess(res));
            }
            return res;
          },
          error => {
            if (type) {
              dispatch({
                type: opts.actionTypes.failure,
                payload: error,
                error: true,
              });
            }
            if (isFunction(onFailure)) {
              dispatch(onFailure(error));
            }
          }
        )
        .finally(() => {
          if (type) {
            dispatch({type: opts.actionTypes.end, payload: type});
          }
        });
    };
  };
}

export function apiRequest(url, {type, ...rest} = {}) {
  if (!isString(url)) {
    logError('apiRequest requires a string as the first argument');
  }
  return {
    API: {
      payload: {
        type,
        url,
        ...rest,
      },
    },
  };
}
