const trimSlash = (value) => String(value || '').replace(/\/+$/, '');

const buildDefaultApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return trimSlash(window.location.origin);
  }
  return 'http://127.0.0.1:81';
};

export const API_BASE_URL = trimSlash(
  process.env.REACT_APP_API_BASE_URL || buildDefaultApiBaseUrl()
);

const defaultFileBaseUrl = `${API_BASE_URL}/uploadFiles`;

export const FILE_BASE_URL = `${trimSlash(
  process.env.REACT_APP_FILE_BASE_URL || defaultFileBaseUrl
)}/`;
