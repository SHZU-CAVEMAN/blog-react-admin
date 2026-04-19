import { useMemo, useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';

// 虚拟列表配置：总数、单行高度、可视区高度、缓冲渲染行数
const TOTAL = 1000;
const ROW_HEIGHT = 76;
const VIEWPORT_HEIGHT = 360;
const OVERSCAN = 6;

const Message = () => {
  const [form] = Form.useForm();
  const [scrollTop, setScrollTop] = useState(0); //已滚动的距离，用于计算可见窗口范围

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
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN); // 计算起始行数，向上扩展 OVERSCAN 行作为缓冲
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2; // 计算可见行数，向上下各扩展 OVERSCAN 行作为缓冲
  const endIndex = Math.min(TOTAL, startIndex + visibleCount); // 计算结束行数，确保不超过总数
  const visibleItems = items.slice(startIndex, endIndex); // 获取当前可见的项目

  // 提交时统计有内容的项目数量，便于演示表单与虚拟列表共存
  const handleSubmit = (values) => {
    const list = values?.messageList || {};
    const filledCount = Object.values(list).filter((item) => item?.content?.trim()).length;
    message.success(`提交成功，已填写 ${filledCount} 项`);
  };

  return (
    <Card title="消息推送（模拟虚拟列表：1000 个表单项）">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* 1 滚动容器：产生滚动条，监听滚动位置 */}
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
          {/* 2 占位层：撑出总高度，用于生成正确滚动条 */}
          <div
            style={{
              height: TOTAL * ROW_HEIGHT,
              position: 'relative',
            }}
          >
            {/* 3 渲染层：实际内容，用绝对定位和top 偏移到正确位置*/}
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