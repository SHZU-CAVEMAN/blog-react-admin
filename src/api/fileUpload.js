import service from './request';

export const getFileDirectoryTree = async () => {
  const res = await service.get('/file-upload/dirs');
  return res?.data || { name: 'uploadFiles', path: '', children: [] };
};

export const createFileDirectory = ({ parentPath = '', name = '' }) => {
  return service.post('/file-upload/dirs', { parentPath, name });
};

export const deleteFileDirectory = ({ dirPath = '', recursive = false }) => {
  return service.delete('/file-upload/dirs', {
    params: {
      dirPath,
      recursive,
    },
  });
};

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

export const uploadFileToDirectory = (file, dirPath = '') => {
  const formData = new FormData();
  formData.append('file1', file);
  formData.append('dirPath', dirPath || '');

  return service.post('/file-upload/upload-single-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
};

export const deleteDirectoryPicture = ({ dirPath = '', fileName = '' }) => {
  return service.delete('/file-upload/files', {
    params: {
      dirPath,
      fileName,
    },
  });
};
