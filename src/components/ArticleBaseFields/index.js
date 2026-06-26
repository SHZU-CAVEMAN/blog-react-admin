import { Form, Input, Select, DatePicker, Card } from 'antd';
import PictureUploadField from '@/components/PictureUploadField';

const ArticleBaseFields = ({
  categoryOptions = [],
  selectedPictureFile,
  onSelectedPictureFileChange,
  compact = false,
}) => {
  return (
    <Card title="文章信息" size={compact ? 'small' : 'default'}>
      <Form.Item
        name="title"
        label="文章名"
        rules={[{ required: true, message: '请输入文章名' }]}
      >
        <Input placeholder="请输入文章名" />
      </Form.Item>

      <Form.Item
        name="categoryId"
        label="分类"
        rules={[{ required: true, message: '请选择分类' }]}
      >
        <Select placeholder="请选择分类" options={categoryOptions} />
      </Form.Item>

      <Form.Item name="publishTime" label="发表时间">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="summary"
        label="说明"
        rules={[{ required: true, message: '请输入说明' }]}
      >
        <Input.TextArea
          placeholder="请输入说明"
          autoSize={{ minRows: compact ? 2 : 3, maxRows: compact ? 6 : 8 }}
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item name="status" label="状态">
        <Select
          placeholder="请选择状态"
          options={[
            { value: 'active', label: 'active' },
            { value: 'disabled', label: 'disabled' },
            { value: 'draft', label: 'draft' },
          ]}
        />
      </Form.Item>

      <Form.Item label="图片">
        <PictureUploadField
          selectedFile={selectedPictureFile}
          onSelectedFileChange={onSelectedPictureFileChange}
        />
      </Form.Item>

      <Form.Item name="picture" hidden>
        <Input />
      </Form.Item>
    </Card>
  );
};

export default ArticleBaseFields;


