jest.mock('axios', () => {
  const state = {
    instance: null as any,
  };

  return {
    __esModule: true,
    __state: state,
    create: jest.fn(() => state.instance),
    default: {
      create: jest.fn(() => state.instance),
      isAxiosError: jest.fn((error: unknown) => !!error),
    },
    isAxiosError: jest.fn((error: unknown) => !!error),
  };
});

const mockNetInfoState = {
  isConnected: true,
  isInternetReachable: true,
  isConnectionExpensive: false,
  isWifiEnabled: true,
  type: 'wifi' as const,
  details: null,
};

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb: (state: typeof mockNetInfoState) => void) => {
    cb(mockNetInfoState);
    return { remove: jest.fn() };
  }),
}));

type AxiosMockModule = {
  __state: { instance: unknown };
  create: jest.Mock;
  default: { create: jest.Mock; isAxiosError: jest.Mock };
  isAxiosError: jest.Mock;
};
type NetInfoModule = {
  addEventListener: jest.Mock;
};
const mockNetInfo: NetInfoModule = {
  addEventListener: jest.fn(),
};

const createAxiosMockInstance = () => {
  const responseInterceptor = { use: jest.fn() };
  const apiInstance = {
    delete: jest.fn(),
    get: jest.fn(),
    interceptors: {
      response: responseInterceptor,
    },
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  };

  return { apiInstance, responseInterceptor };
};

describe('ApiClient', () => {
  let apiInstance: ReturnType<typeof createAxiosMockInstance>['apiInstance'];
  let capturedErrorHandler: ((error: { message: string; response?: { status: number; data?: unknown } }) => Promise<never>) | null;
  let ApiClient: typeof import('../client')['ApiClient'];
  let apiClient: typeof import('../client')['apiClient'];

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    const built = createAxiosMockInstance();
    apiInstance = built.apiInstance;
    const axiosMock = jest.requireMock('axios') as AxiosMockModule;
    axiosMock.__state.instance = apiInstance;

    capturedErrorHandler = null;
    built.responseInterceptor.use.mockImplementation((_, onRejected: unknown) => {
      capturedErrorHandler = onRejected as (error: {
        message: string;
        response?: { status: number; data?: unknown };
      }) => Promise<never>;
    });

    const netInfoMock = jest.requireMock('@react-native-community/netinfo') as NetInfoModule;
    netInfoMock.addEventListener.mockImplementation((listener: (state: { isConnected: boolean }) => void) => {
      listener({ isConnected: true });
      return { remove: jest.fn() };
    });
    mockNetInfo.addEventListener = netInfoMock.addEventListener;

    const clientModule = require('../client') as { ApiClient: typeof import('../client')['ApiClient']; apiClient: typeof import('../client')['apiClient'] };
    ({ ApiClient, apiClient } = clientModule);
  });

  it('executes GET and POST with the configured URL path', async () => {
    const expectedData = { ok: true };
    apiInstance.get.mockResolvedValue({ data: expectedData });
    apiInstance.post.mockResolvedValue({ data: expectedData });

    const client = new ApiClient();
    await client.get('/menu');
    await client.post('/checkout', { foo: 'bar' });

    expect(apiInstance.get).toHaveBeenCalledWith('/menu', undefined);
    expect(apiInstance.post).toHaveBeenCalledWith('/checkout', { foo: 'bar' }, undefined);
  });

  it('propagates offline status as domain error for network failures', async () => {
    const error = { message: 'Network Error' } as const;
    const client = new ApiClient();
    const handled = await (client as any).handleError(error);

    expect(handled).toMatchObject({
      isOffline: true,
      message: 'No internet connection. Please check your connection and try again.',
    });
  });

  it('maps API response errors with status and message', async () => {
    const error = {
      message: 'Request failed',
      response: {
        status: 500,
        data: { message: 'Menu service unavailable' },
      },
    } as const;

    const client = new ApiClient();
    const handled = await (client as any).handleError(error);

    expect(handled).toMatchObject({
      isOffline: false,
      status: 500,
      message: 'Menu service unavailable',
    });
  });

  it('falls back to server status text when response has no message', async () => {
    const error = {
      message: 'Request failed',
      response: {
        status: 502,
        data: {},
      },
    } as const;

    const client = new ApiClient();
    const handled = await (client as any).handleError(error);

    expect(handled).toMatchObject({
      isOffline: false,
      status: 502,
      message: 'Server error: 502',
    });
  });

  it('updates online state from NetInfo updates', () => {
    const listener = jest.fn();
    const netInfoMock = jest.requireMock('@react-native-community/netinfo') as NetInfoModule;
    mockNetInfo.addEventListener = netInfoMock.addEventListener;
    mockNetInfo.addEventListener.mockImplementation((cb: (state: { isConnected: boolean }) => void) => {
      listener();
      cb({ isConnected: false });
      return { remove: jest.fn() };
    });

    const client = new ApiClient();

    expect(listener).toHaveBeenCalled();
    expect(client.getIsOnline()).toBe(false);
  });

  it('uses interceptor error handler path for rejected requests', async () => {
    const client = new ApiClient();

    expect(capturedErrorHandler).not.toBeNull();

    await expect(
      capturedErrorHandler!({
        message: 'Request failed',
        response: {
          status: 404,
          data: { message: 'Nope' },
        },
      })
    ).rejects.toMatchObject({ isOffline: false, status: 404, message: 'Nope' });

    expect(apiInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('maps client-side errors with no server response and no message', async () => {
    const client = new ApiClient();
    const handled = await (client as any).handleError({});

    expect(handled).toMatchObject({
      isOffline: false,
      message: 'An unexpected error occurred',
    });
  });

  it('returns raw error message when no status/body details exist', async () => {
    const client = new ApiClient();
    const handled = await (client as any).handleError({ message: 'unexpected fail' } as const);

    expect(handled).toMatchObject({
      isOffline: false,
      message: 'unexpected fail',
    });
  });

  it('uses the shared apiClient export for direct get calls', async () => {
    jest
      .spyOn(apiClient, 'get')
      .mockResolvedValue([{ id: 'entree-1' }]);

    expect(await apiClient.get('/menu')).toEqual([{ id: 'entree-1' }]);
  });
});
