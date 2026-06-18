import service from './request';
import { FILE_BASE_URL } from '@/config/env';

const normalizePictureUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const cleaned = raw.replace(/^\/+/, '').replace(/^uploadFiles\//i, '');
  return `${FILE_BASE_URL}${cleaned}`;
};

const extractPictureName = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  return raw
    .replace(FILE_BASE_URL, '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^\/+/, '')
    .replace(/^uploadFiles\//i, '');
};

const normalizePictureList = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  return list
    .map((item, index) => {
      if (typeof item === 'string') {
        const name = extractPictureName(item);
        return name ? { id: `${name}-${index}`, name, url: normalizePictureUrl(name) } : null;
      }
      const rawName = item?.name || item?.fileName || item?.filename || item?.path || item?.url || '';
      const name = extractPictureName(rawName);
      const url = normalizePictureUrl(item?.url || item?.path || name);
      if (!name || !url) {
        return null;
      }
      return {
        id: item?.id || `${name}-${index}`,
        name,
        url,
        size: item?.size || item?.fileSize || '',
        createdAt: item?.createdAt || item?.created_at || item?.uploadTime || '',
      };
    })
    .filter(Boolean);
};

const parseDirectoryIndex = (html) => {
  if (typeof DOMParser === 'undefined') {
    return [];
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const anchors = Array.from(doc.querySelectorAll('a'));

  return anchors
    .map((anchor, index) => {
      const href = anchor.getAttribute('href') || '';
      const name = extractPictureName(href || anchor.textContent || '');
      if (!name || /\/$/.test(name)) {
        return null;
      }
      return {
        id: `${name}-${index}`,
        name,
        url: normalizePictureUrl(name),
      };
    })
    .filter(Boolean);
};

const tryRequests = async (requestFactories) => {
  let lastError;
  for (const createRequest of requestFactories) {
    try {
      return await createRequest();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('request failed');
};

/**
 * 上传单个文件
 * @param {File} file - 要上传的文件对象
 * @param {string|number} articleId - 文章ID
 * @returns {Promise<{ status: number, message: string, content_key: string, original_name: string }>}
 */
export const uploadSingleFile = (file, articleId) => {
  const formData = new FormData();
  formData.append('file1', file); // 后端 multer 字段名是 file1
  if (articleId) {
    formData.append('articleId', String(articleId));
  }
  return service.post('/upload-single-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000, // 文件上传给更长的超时时间
  });
};

export const getPictureList = async () => {
  try {
    const payload = await tryRequests([
      () => service.get('/upload-files'),
      () => service.get('/pictures'),
      () => service.get('/picture'),
    ]);
    const list = normalizePictureList(payload);
    if (list.length) {
      return list;
    }
  } catch (error) {
    // ignore and fallback to directory parsing below
  }

  const response = await fetch(FILE_BASE_URL, { method: 'GET' });
  if (!response.ok) {
    throw new Error('后台未提供图片列表接口或 uploadFiles 目录索引');
  }
  const html = await response.text();
  return parseDirectoryIndex(html);
};

export const deletePictureFile = async (nameOrUrl) => {
  const fileName = extractPictureName(nameOrUrl);
  if (!fileName) {
    throw new Error('缺少图片名称');
  }

  return tryRequests([
    () => service.delete('/upload-files', { data: { fileName } }),
    () => service.delete('/pictures', { data: { fileName } }),
    () => service.delete('/picture', { data: { fileName } }),
    () => service.delete(`/upload-files/${encodeURIComponent(fileName)}`),
    () => service.delete(`/pictures/${encodeURIComponent(fileName)}`),
    () => service.delete(`/picture/${encodeURIComponent(fileName)}`),
  ]);
};
