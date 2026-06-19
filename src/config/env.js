const trimSlash = (value) => String(value || '').replace(/\/+$/, '');

const buildDefaultApiBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? trimSlash(window.location.origin)
    : 'http://127.0.0.1:8081';
};

const buildDefaultFileBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? `${trimSlash(window.location.origin)}/uploadFiles`
    : 'http://127.0.0.1:8081/uploadFiles';
};

export const API_BASE_URL = trimSlash(
  process.env.REACT_APP_API_BASE_URL || buildDefaultApiBaseUrl()
);

export const FILE_BASE_URL = `${trimSlash(
  process.env.REACT_APP_FILE_BASE_URL || buildDefaultFileBaseUrl()
)}/`;
