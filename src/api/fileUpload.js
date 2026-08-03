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
  // /file-upload/files-by-table 查询数据表的文件记录
  // /file-upload/files  查询纯文件目录
  const res = await service.get('/file-upload/files-by-table', {  
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
export const deleteDirectoryPicture = (id = '') => {
  return service.delete(`/file-upload/files/${id}`);
};
