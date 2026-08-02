import service from './request';

// 获取文件目录树
export const getFileDirectoryTree = async () => {
  const res = await service.get('/file-upload/dirs');
  return res?.data || { name: 'uploadFiles', path: '', children: [] };
};
// 创建分类
export const createFileDirectory = ({ parentPath = '', name = '' }) => {
  return service.post('/file-upload/dirs', { parentPath, name });
};
// 批量移动图片
export const moveFileDirectories = ({ fromPaths = [], toPath = '' } = {}) => {
  return service.post('/file-upload/dirs/move', {
    fromPaths,
    toPath,
  });
};
// 删除分类
export const deleteFileDirectory = ({ dirPath = '', recursive = false }) => {
  return service.delete('/file-upload/dirs', {
    params: {
      dirPath,
      recursive,
    },
  });
};
// 查询分类下的数据
export const getDirectoryPictures = async (dirPath = '') => {
  // /file-upload/files-by-table 为查询数据表的文件
  // /file-upload/files  为查询 uploadFiles 目录的文件
  const res = await service.get('/file-upload/files', {  
    params: {
      dirPath,
    },
  });
  return res?.data || { dirPath: '', files: [] };
};
// 上传数据
export const uploadFileToDirectory = (file, dirPath = '') => {
  const formData = new FormData();
  formData.append('file1', file);
  formData.append('dirPath', dirPath || '');

  return service.post('/file-upload/upload-single-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
};
// 删除分类下的数据
export const deleteDirectoryPicture = ({ dirPath = '', fileName = '' }) => {
  return service.delete('/file-upload/files', {
    params: {
      dirPath,
      fileName,
    },
  });
};
