/* 保留最原始的上传接口逻辑 */

import service from './request';

// 上传单个文件，文章id可选，后台生成三份文件（jpg,avif,webp）
// 调用者：article/list/index.js，article/create/index.js，picture/index.js
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

// 查询所有上传的文件列表
export const getPictureList = async () => {
  return service.get('/upload-files');
};
// 删除指定的文件
export const deletePictureFile = async (name) => {
  return service.delete(`/upload-files/${encodeURIComponent(name)}`);
};
