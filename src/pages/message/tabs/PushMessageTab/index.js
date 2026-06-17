import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import './index.less';

// 虚拟列表配置：总数、单行高度、可视区高度、缓冲渲染行数
const TOTAL = 1000;
const ROW_HEIGHT = 76;
const VIEWPORT_HEIGHT = 200;
const OVERSCAN = 6;

const PushMessageTab = () => {
  const [form] = Form.useForm();
  const [scrollTop, setScrollTop] = useState(0); // 已滚动的距离，用于计算可见窗口范围

  // 生成演示数据，useMemo 避免每次渲染都重新创建数组
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
    <div className="push-message-tab">
      <Card title="消息推送（模拟虚拟列表：1000 个表单项）">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div
            className="virtual-scroll-box"
            style={{
              height: VIEWPORT_HEIGHT,
            }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <div
              style={{
                height: TOTAL * ROW_HEIGHT,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
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
                    <Form.Item name={['messageList', item.id, 'content']} label={item.label}>
                      <Input placeholder={`请输入第 ${item.id} 条消息内容`} />
                    </Form.Item>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="submit-row">
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PushMessageTab;
