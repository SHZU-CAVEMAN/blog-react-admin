import { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Upload, Button, message } from 'antd';

// 入参：文件名，文件对象，回调
const PictureUploadField = ({ fieldName = 'picture', selectedFile, onSelectedFileChange }) => {
  const form = Form.useFormInstance(); // 拿到当前 Form（父级）对象的实例
  const picture = Form.useWatch(fieldName, form); //  监听 picture 字段的值变化，变化后组件重新渲染
  const areaHeight = 200;
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState('');
  const prevSelectedFileRef = useRef(selectedFile);

  useEffect(() => {
    const prevSelectedFile = prevSelectedFileRef.current;
    // 仅在 selectedFile 从有值变为空时清理，避免未传 selectedFile 的页面把预览误清掉
    if (prevSelectedFile && !selectedFile && pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl('');
    }
    prevSelectedFileRef.current = selectedFile;
    return undefined;
  }, [selectedFile, pendingPreviewUrl]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  // 选择图片后只暂存，提交文章时再一起上传
  // beforeUpload 里返回 false 阻止 Upload 组件自动上传
  const beforeUpload = useCallback((file) => {
    if (!file.type || !file.type.startsWith('image/')) {
      message.warning('只能上传图片文件');
      return Upload.LIST_IGNORE;
    }
    // 如果之前有待上传的图片，先撤销它的预览 URL，释放内存
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    // 创建一个新的预览 URL
    setPendingPreviewUrl(URL.createObjectURL(file));
    // 把选中的文件对象传给父组件，父组件会在提交时处理上传
    onSelectedFileChange?.(file);
    return false;
  }, [onSelectedFileChange, pendingPreviewUrl]);

  // 清除：优先清除待上传图片；否则清除已上传图片地址
  const handleClear = useCallback(() => {
    if (selectedFile) {
      onSelectedFileChange?.(null);
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl('');
      }
      return;
    }
    form.setFieldValue(fieldName, '');
  }, [fieldName, form, onSelectedFileChange, pendingPreviewUrl, selectedFile]);

  const previewSrc = pendingPreviewUrl || picture;

  return (
    <div>
    {/* Ant Design 里的“拖拽上传”组件 */}
      <Upload.Dragger
        accept="image/*"
        maxCount={1}
        multiple={false}
        showUploadList={false}
        beforeUpload={beforeUpload}
        style={{
          width: '100%',
          height: areaHeight,
          padding: 0,
          overflow: 'hidden',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: areaHeight,  //不用百分比，否则可能会撑不开父层高度
          }}
        >
          {previewSrc ? (
            <>
              <img
                src={previewSrc}
                alt="文章图片预览"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                {selectedFile ? '已选择新图片，点击保存/发布时会一起上传' : '点击或拖拽更换图片'}
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: 16,
                boxSizing: 'border-box',
              }}
            >
              <p style={{ marginBottom: 8, fontWeight: 500 }}>点击或拖拽图片到此区域上传</p>
              <p style={{ margin: 0, color: '#666' }}>支持本地图片选择，保存/发布时上传</p>
            </div>
          )}

          {previewSrc ? (
            <Button
              size="small"
              type="default"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              // 点击清除按钮时阻止事件冒泡
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 3,
                background: 'rgba(255, 255, 255, 0.92)',
                borderColor: '#d9d9d9',
              }}
            >
              清除
            </Button>
          ) : null}
        </div>
      </Upload.Dragger>
    </div>
  );
};

export default PictureUploadField;