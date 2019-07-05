# Redux API middleware

A tiny [Redux](https://redux.js.org/) middleware for simplifying the
communication with API endpoints.

## Why

When writing async action creators that interact with API endpoints (for
example with `redux-thunk`) it is not uncommon for logic to be duplicated.
Each creator will typically configure a request via a library such as `axios` or
`fetch` and dispatch additional actions for loading or error states.

By using middleware these actions can be intercepted and this logic can be
centralised, greatly reducing boilerplate and easing testing.

## Installation

**yarn**
```
yarn add @simonsmith/redux-api-middleware
```

**npm**
```
npm install --save @simonsmith/redux-api-middleware
```

## Quick example

Pass `createApiMiddleware` a request library as the first argument and any
configuration options. Any promise based library can be used such as
[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
or [`ky`](https://github.com/sindresorhus/ky). You're free to pass your own
function to prepare the promise for the
middleware (such as first calling `response.json()` in `fetch`).

```js
import {createApiMiddleware} from '@simonsmith/redux-api-middleware';
import {configureStore} from 'redux-starter-kit';
import axios from 'axios';

const store = configureStore({
  reducer: state => state,
  middleware: [
    createApiMiddleware(axios, {
      requestDefaults: {
        baseURL: 'http://myapi.com',
      },
    }),
  ],
});
```

Use the `apiRequest` helper function to send a request through the middleware.
Actions for request start, end and failure will be dispatched as well as calling
your `onSuccess` or `onFailure` callbacks. These can be used to dispatch
additional actions.

```js
import {apiRequest} from '@simonsmith/redux-api-middleware';

// An action creator
export function requestAllUsers() {
  return apiRequest('/users', {
    type: FETCH_USERS,
    onSuccess: dispatchAnotherAction,
  });
}
```

## API

### `createApiMiddleware(request, options?)`

Returns a function that acts as the middleware which can be passed to Redux
during store creation.

#### `request: (url, options?) => Promise`

This function is used by the middleware to send a network request. It must
return a promise that resolves with the payload from the server.

For example when using the `fetch` function it requires `response.json()` to be
called and the promise returned:

```js
const requestFunc = (url, options) => {
  return fetch(url, options).then(res => res.json());
}

createApiMiddleware(requestFunc),
```

#### `options?: Object`

* **actionTypes** _(object)_
  * **start** _(string)_ - Dispatched before a request begins _default_ `API_REQUEST_START`
  * **end** _(string)_ - Dispatched when a request ends _default_ `API_REQUEST_END`
  * **failure** _(string)_ - Dispatched when a request fails _default_ `API_REQUEST_FAILURE`
* **requestDefaults** _(object)_ Options passed to the request library on each request


The `options` argument passed to `request` is merged with the values from the
`apiRequest` function and any values in the `requestDefaults` object provided in
the options. This allows things like headers to be provided on all requests by
default:

```js
createApiMiddleware(requestFunc, {
  requestDefaults: {
    headers: {
     'Content-Type': 'application/json',
    },
  },
}),
```

These can be overridden in the second argument to `apiRequest` if needed.

### `apiRequest(url, options?)`

Creates an action that will be dispatched to the store and intercepted by the
middleware.

```js
function updatePost(id, newPost) {
  return apiRequest(`/post/${id}`, {
    type: 'UPDATE_POST',
    onSuccess: getPosts,
    onFailure: logError,
    // `method` and `data` passed to the `request` function
    method: 'PUT',
    data: newPost,
  });
}
```

#### `url: String`

The url that the request will be made to.

#### `options?: Object`

Can contain a `type`, `onSuccess` and `onFailure`. Any additional values will be
merged with the `requestDefaults` passed to the `request` function.

**`type: String`**

When a `type` is provided the middleware will dispatch each of the actions in
`actionTypes` with a `payload` of the `type` value. This allows different
requests to be differentiated from one another.

**`onSuccess: Function`**

When provided this function will be called with the response from the `request`
function. Its return value should be an action as it will be passed to `dispatch`.

**`onFailure: Function`**

When provided this function will be called with the error from the `request`
function. Its return value should be an action as it will be passed to `dispatch`.

## Configuring common request libraries

### [`axios`](https://github.com/axios/axios)

One of the simplest to configure, the `axios` object can be passed directly to
`createApiMiddleware`:

```js
createApiMiddleware(axios);
```

### [`ky`](https://github.com/sindresorhus/ky)

Return a promise from the `json` method:

```js
const requestFunc = (url, options) => ky(url, options).json();

createApiMiddleware(requestFunc);
```

### `fetch`

Return a promise from `response.json`:

```js
const requestFunc = (url, options) => fetch(url, options).then(res => res.json());

createApiMiddleware(requestFunc);
```

## Actions

In addition to the success and failure callbacks there are also actions
dispatched when a request is loading or encounters an error. This allows the
logic to be centralised in separate reducers.

All actions dispatched conform to the
[FSA](https://github.com/redux-utilities/flux-standard-action) spec.

### Loading

When the `type` option is used the following loading actions are dispatched:

```js
apiRequest('/url', {
  type: 'SOME_ACTION',
});

// actions
{type: 'API_REQUEST_START', payload: 'SOME_ACTION'}
{type: 'API_REQUEST_END', payload: 'SOME_ACTION'}
```

The `payload` is set to the `type` value allowing these actions to be
differentiated in a reducer.

### Error

If an error is encountered an error action is dispatched:

```js
{type: 'API_REQUEST_FAILURE', payload: Error('some error'), error: true}
```

## Handling loading states in a reducer

It's recommended to create a separate reducer to handle loading actions. This
has the added benefit of keeping reducers free from repetitive logic (such as
`isLoading` state):

```js
import {createReducer} from 'redux-starter-kit';

const initialState = {};

export const loadingReducer = createReducer(initialState, {
  API_REQUEST_START: (state, action) => {
    return {
      ...state,
      [action.payload]: true,
    };
  },
  API_REQUEST_END: (state, action) => {
    return {
      ...state,
      [action.payload]: false,
    };
  },
});
```
```
// state example
{
  loading: {
    FETCH_PROFILE: true,
    CREATE_USER: false,
  }
}
```

Components can select the loading state they are interested in and use this
value to display a spinner or text to the user.

## Contributing

Pull requests are welcome!

## Credit

* [Data fetching in Redux apps — a 100% correct approach](https://blog.logrocket.com/data-fetching-in-redux-apps-a-100-correct-approach-4d26e21750fc/)
