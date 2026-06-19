const trimSlash = (value) => String(value || '').replace(/\/+$/, '');

const buildDefaultApiBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? trimSlash(window.location.origin)
<<<<<<< HEAD
    : 'http://127.0.0.1:8081';
=======
    : 'http://127.0.0.1:81';
>>>>>>> 7c45607819a4f29e0f083eb218cdc548de369d02
};

const buildDefaultFileBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? `${trimSlash(window.location.origin)}/uploadFiles`
<<<<<<< HEAD
    : 'http://127.0.0.1:8081/uploadFiles';
=======
    : 'http://127.0.0.1:81/uploadFiles';
>>>>>>> 7c45607819a4f29e0f083eb218cdc548de369d02
};

export const API_BASE_URL = trimSlash(
  process.env.REACT_APP_API_BASE_URL || buildDefaultApiBaseUrl()
);

export const FILE_BASE_URL = `${trimSlash(
  process.env.REACT_APP_FILE_BASE_URL || buildDefaultFileBaseUrl()
)}/`;
