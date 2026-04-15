import { useMemo, useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';

// 虚拟列表配置：总数、单行高度、可视区高度、缓冲渲染行数
const TOTAL = 1000;
const ROW_HEIGHT = 76;
const VIEWPORT_HEIGHT = 360;
const OVERSCAN = 6;

const Message = () => {
  const [form] = Form.useForm();
  const [scrollTop, setScrollTop] = useState(0);

  // 生成 1000 条演示数据，useMemo 避免每次渲染都重新创建数组
  const items = useMemo(
    () =>
      Array.from({ length: TOTAL }, (_, index) => ({
        id: index + 1,
        label: `推送项 ${index + 1}`,
      })),
    []
  );

  // 根据滚动位置计算当前应渲染的窗口范围
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(TOTAL, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);

  // 提交时统计有内容的项目数量，便于演示表单与虚拟列表共存
  const handleSubmit = (values) => {
    const list = values?.messageList || {};
    const filledCount = Object.values(list).filter((item) => item?.content?.trim()).length;
    message.success(`提交成功，已填写 ${filledCount} 项`);
  };

  return (
    <Card title="消息推送（模拟虚拟列表：1000 个表单项）">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div
          style={{
            height: VIEWPORT_HEIGHT,
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            background: '#fafafa',
          }}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          <div
            style={{
              // 占位层总高度 = 全量数据高度，用于生成正确滚动条
              height: TOTAL * ROW_HEIGHT,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                // 将可见窗口整体平移到对应位置，只渲染窗口内表单项
                top: startIndex * ROW_HEIGHT,
                left: 0,
                right: 0,
              }}
            >
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    height: ROW_HEIGHT,
                    paddingBottom: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  <Form.Item
                    name={['messageList', item.id, 'content']}
                    label={item.label}
                    rules={[{ required: item.id <= 3, message: '请输入内容' }]}
                  >
                    <Input placeholder={`请输入第 ${item.id} 条消息内容`} />
                  </Form.Item>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default Message;