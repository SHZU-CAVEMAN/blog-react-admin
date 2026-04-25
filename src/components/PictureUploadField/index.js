import { useCallback } from 'react';
import { Form, Upload, Button, message } from 'antd';

const PictureUploadField = ({ fieldName = 'picture' }) => {
  const form = Form.useFormInstance(); // 拿到当前 Form（父级）对象的实例
  const picture = Form.useWatch(fieldName, form); //  监听 pircture字段的值变化，变化后立即刷新
  const areaHeight = 200;

  // 上传前检查
  const beforeUpload = useCallback((file) => {
    // file 对象 继承自原生File对象，有个 type 属性，里面存的就是文件的 MIME 类型，比如 image/png、image/jpeg 等
    if (!file.type || !file.type.startsWith('image/')) {
      message.warning('只能上传图片文件');
      // upload 组件提供了一个特殊的返回值 Upload.LIST_IGNORE，返回这个值可以告诉组件忽略这个文件，不要上传它，也不要把它添加到上传列表中，这样用户就看不到这个文件了，就相当于我们直接阻止了这个文件被上传和显示的过程
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldValue(fieldName, String(reader.result || '')); // 将图片的 base64 字符串设置到 Form 的字段值中，父级组件就能拿到这个值了
    };
    reader.onerror = () => {
      message.error('图片读取失败，请重试');
    };
    reader.readAsDataURL(file); // 将图片文件读取为 base64 字符串
    return false;
  }, [fieldName, form]);

  // 清空图片
  const handleClear = useCallback(() => {
    form.setFieldValue(fieldName, ''); 
  }, [fieldName, form]);

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
          {picture ? (
            <>
              <img
                src={picture}
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
                点击或拖拽更换图片
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
              <p style={{ margin: 0, color: '#666' }}>支持本地图片选择，上传后自动预览</p>
            </div>
          )}
        </div>
      </Upload.Dragger>

      {picture ? (
        <div style={{ marginTop: 8 }}>
          <Button type="link" style={{ paddingLeft: 0 }} onClick={handleClear}>
            清除图片
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default PictureUploadField;