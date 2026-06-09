import service from './request';

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
