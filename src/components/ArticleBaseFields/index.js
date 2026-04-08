import { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Collapse } from 'antd';

const ArticleBaseFields = ({ categoryOptions = [] }) => {
  const rootRef = useRef(null); //组件根节点
  const containerRef = useRef(null);  // 被设置宽度的盒子
  const resizeRef = useRef(null); // 保存拖拽中的临时数据 
  const [columnSpan, setColumnSpan] = useState(12); //控制一行几列
  const [boxWidth, setBoxWidth] = useState(null); //组件当前宽度
  const [justifyContent, setJustifyContent] = useState('flex-start'); // 控制内容对齐方式（拖左边靠右、拖右边靠左）

  // 1 计算兄弟元素的外部宽度（包括 margin）
  const getSiblingOuterWidth = useCallback((el) => {
    const style = window.getComputedStyle(el);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    return el.offsetWidth + marginLeft + marginRight;
  }, []);
  // 2 计算当前组件在这一行里 “最多还能有多宽” （父容器宽度 - 兄弟占用宽度 = 当前组件可用最大宽度）
  const getDynamicMaxWidth = useCallback(() => {
    const rootElement = rootRef.current;
    const parent = rootElement?.parentElement;
    if (!rootElement || !parent) {
      return window.innerWidth;
    }
    const parentStyle = window.getComputedStyle(parent);
    const isHorizontalFlex =
      parentStyle.display.includes('flex') &&
      parentStyle.flexDirection !== 'column' &&
      parentStyle.flexDirection !== 'column-reverse'; //只有当父容器是横向 flex（display: flex 且 flex-direction 不是 column）时，才会去扣掉兄弟组件宽度，用于并排布局联动。
    const parentWidth = parent.clientWidth;
    if (!isHorizontalFlex) {
      return Math.max(0, parentWidth);
    }

    let occupiedWidth = 0;
    Array.from(parent.children).forEach((child) => {
      if (child !== rootElement && child instanceof HTMLElement) {
        occupiedWidth += getSiblingOuterWidth(child);
      }
    });
    return Math.max(0, parentWidth - occupiedWidth);
  }, [getSiblingOuterWidth]);
  // 3 限制宽度在合理范围内
  const clampWidth = useCallback((nextWidth) => {
    const maxWidth = getDynamicMaxWidth();
    const minWidth = Math.min(360, maxWidth);
    if (maxWidth <= 0) {
      return 0;
    }
    return Math.min(Math.max(nextWidth, minWidth), maxWidth);
  }, [getDynamicMaxWidth]);
  // 4 拖拽交互
  const startResize = (side, e) => {
    e.preventDefault();
    // 右侧拖拽时组件靠左，左侧拖拽时组件靠右。
    setJustifyContent(side === 'right' ? 'flex-start' : 'flex-end');
    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 0;
    resizeRef.current = { side, startX, startWidth };
    const onMouseMove = (event) => {
      if (!resizeRef.current) {
        return;
      }
      const deltaX = event.clientX - resizeRef.current.startX;
      const nextWidth =
        resizeRef.current.side === 'right'
          ? resizeRef.current.startWidth + deltaX
          : resizeRef.current.startWidth - deltaX;
      setBoxWidth(clampWidth(nextWidth));
    };
    const onMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  // 5 内部变化
  useEffect(() => {
    const element = containerRef.current;
    if (!element) { // 拿到当前组件，若不存在则返回
      return undefined;
    }
    // 初始化组件宽度
    if (boxWidth === null) {
      const initialWidth = element.offsetWidth || rootRef.current?.clientWidth || 0;
      setBoxWidth(clampWidth(initialWidth));
    }
    // 根据当前宽度 决定一行几列
    const updateLayout = (width) => {
      if (width < 520) {
        setColumnSpan(24);
        return;
      }
      if (width < 900) {
        setColumnSpan(12);
        return;
      }
      setColumnSpan(8);
    };
    updateLayout(element.offsetWidth);
    // 监听组件宽度变化
    const observer = new ResizeObserver(([entry]) => {
      updateLayout(entry.contentRect.width);
    });
    observer.observe(element);
    // 组件卸载或 effect 重新执行时清理，防止内存泄漏和重复监听
    return () => {
      observer.disconnect();
    };
  }, [boxWidth, clampWidth]);
  // 6 外部变化 时将宽度变回合理范围内
  useEffect(() => {
    // 浏览器窗口变化 
    const onWindowResize = () => {
      if (boxWidth === null) {
        return;
      }
      setBoxWidth((prev) => clampWidth(prev));
    };
    // 父容器和兄弟组件变化
    const parent = rootRef.current?.parentElement;
    let parentObserver;
    if (parent) {
      parentObserver = new ResizeObserver(() => {
        setBoxWidth((prev) => {
          if (prev === null) {
            return prev;
          }
          return clampWidth(prev);
        });
      });
      parentObserver.observe(parent);

      Array.from(parent.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          parentObserver.observe(child);
        }
      });
    }
    // 监听浏览器窗口变化 
    window.addEventListener('resize', onWindowResize);
    // 清除
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (parentObserver) {
        parentObserver.disconnect();
      }
    };
  }, [boxWidth, clampWidth]);

  return (
    <div ref={rootRef} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent, overflowX: 'hidden' }}>
    <div
      ref={containerRef}
      style={{
        width: boxWidth ? `${boxWidth}px` : '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        padding: 0,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        onMouseDown={(e) => startResize('left', e)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          zIndex: 5,
        }}
      />
      <div
        onMouseDown={(e) => startResize('right', e)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          zIndex: 5,
        }}
      />
      <Collapse
        defaultActiveKey={['1']}
        items={[
          {
            key: '1',
            label: '文章信息',
            children: (
              <Row gutter={16}>
                <Col span={columnSpan}>
                  <Form.Item
                    name="title"
                    label="文章名"
                    rules={[{ required: true, message: '请输入文章名' }]}
                  >
                    <Input placeholder="请输入文章名" />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item name="picture" label="图片地址">
                    <Input placeholder="https://image.xxx.com/a.png" />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item
                    name="categoryId"
                    label="分类"
                    rules={[{ required: true, message: '请选择分类' }]}
                  >
                    <Select placeholder="请选择分类" options={categoryOptions} />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item name="publishTime" label="发表时间">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item
                    name="summary"
                    label="说明"
                    rules={[{ required: true, message: '请输入说明' }]}
                  >
                    <Input placeholder="请输入说明" />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item
                    name="status"
                    label="状态"
                  >
                    <Input disabled/>
                  </Form.Item>
                </Col>

              </Row>
            ),
          },
        ]}
      />
    </div>
    </div>
  );
};

export default ArticleBaseFields;