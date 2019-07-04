import {createApiMiddleware, apiRequest} from './api';
import configureMockStore from 'redux-mock-store';

const createStore = (request, opts) => {
  const mockStore = configureMockStore([createApiMiddleware(request, opts)]);
  return mockStore();
};

test('throws error if a request object is missing', () => {
  expect(() => {
    createStore();
  }).toThrow();
});

test('ignores actions that do not match the correct API format', () => {
  const store = createStore(jest.fn());
  store.dispatch({type: 'FOO'});
  expect(store.getActions()).toEqual([{type: 'FOO'}]);
});

test('passes url and options to request object', async () => {
  const requestFn = jest.fn().mockResolvedValue('some response');
  const store = createStore(requestFn);
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
    })
  );
  expect(requestFn).toHaveBeenCalledWith('/url', {option: 'value'});
});

test('does not dispatch anything if type or onSuccess/onFailure are missing', async () => {
  const requestFn = jest.fn().mockResolvedValue('some response');
  const store = createStore(requestFn);
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
    })
  );
  expect(store.getActions()).toEqual([]);
});

test('dispatches action from onSuccess function', async () => {
  const requestFn = jest.fn().mockResolvedValue('some response');
  const store = createStore(requestFn);
  const onSuccess = jest.fn().mockReturnValue({type: 'SUCCESS'});
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
      onSuccess,
    })
  );
  expect(onSuccess).toHaveBeenCalledWith('some response');
  expect(store.getActions()).toEqual([{type: 'SUCCESS'}]);
});

test('dispatches action from onFailure function', async () => {
  const requestFn = jest.fn().mockRejectedValue('some response');
  const store = createStore(requestFn);
  const onFailure = jest.fn().mockReturnValue({type: 'FAILURE'});
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
      onFailure,
    })
  );
  expect(onFailure).toHaveBeenCalledWith('some response');
  expect(store.getActions()).toEqual([{type: 'FAILURE'}]);
});

test('dispatches start and end actions with the type as the payload', async () => {
  const requestFn = jest.fn().mockResolvedValue('some response');
  const store = createStore(requestFn);
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
      type: 'SOME_ACTION',
    })
  );
  expect(store.getActions()).toEqual([
    {type: 'API_REQUEST_START', payload: 'SOME_ACTION'},
    {type: 'API_REQUEST_END', payload: 'SOME_ACTION'},
  ]);
});

test('allows custom actions', async () => {
  const requestFn = jest.fn().mockRejectedValue('some response');
  const store = createStore(requestFn, {
    actionTypes: {
      start: 'START',
      end: 'END',
      failure: 'FAIL',
    },
  });
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
      type: 'SOME_ACTION',
    })
  );
  expect(store.getActions()).toEqual([
    {type: 'START', payload: 'SOME_ACTION'},
    {type: 'FAIL', payload: 'some response', error: true},
    {type: 'END', payload: 'SOME_ACTION'},
  ]);
});

test('checks for response.json() when request object is `fetch`', async () => {
  const mockFetch = jest
    .fn()
    .mockResolvedValue({json: jest.fn().mockResolvedValue('some json')});
  const store = createStore(mockFetch);
  const onSuccess = jest.fn().mockReturnValue({type: 'SUCCESS'});
  await store.dispatch(
    apiRequest('/url', {
      option: 'value',
      onSuccess,
    })
  );
  expect(onSuccess).toHaveBeenCalledWith('some json');
  expect(store.getActions()).toEqual([{type: 'SUCCESS'}]);
});

test('apiRequest checks first argument should be string', () => {
  expect(() => {
    apiRequest({});
  }).toThrow();
});
