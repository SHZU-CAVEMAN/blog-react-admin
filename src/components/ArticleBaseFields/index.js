import { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Collapse } from 'antd';

const ArticleBaseFields = ({ categoryOptions = [] }) => {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const resizeRef = useRef(null);
  const [columnSpan, setColumnSpan] = useState(12);
  const [boxWidth, setBoxWidth] = useState(null);
  const [justifyContent, setJustifyContent] = useState('flex-start');

  const getSiblingOuterWidth = useCallback((el) => {
    const style = window.getComputedStyle(el);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    return el.offsetWidth + marginLeft + marginRight;
  }, []);

  const getDynamicMaxWidth = useCallback(() => {
    const rootElement = rootRef.current;
    const parent = rootElement?.parentElement;
    if (!rootElement || !parent) {
      return window.innerWidth;
    }

    let occupiedWidth = 0;
    Array.from(parent.children).forEach((child) => {
      if (child !== rootElement && child instanceof HTMLElement) {
        occupiedWidth += getSiblingOuterWidth(child);
      }
    });

    const parentWidth = parent.clientWidth;
    return Math.max(0, parentWidth - occupiedWidth);
  }, [getSiblingOuterWidth]);

  const clampWidth = useCallback((nextWidth) => {
    const maxWidth = getDynamicMaxWidth();
    const minWidth = Math.min(360, maxWidth);

    if (maxWidth <= 0) {
      return 0;
    }

    return Math.min(Math.max(nextWidth, minWidth), maxWidth);
  }, [getDynamicMaxWidth]);

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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    if (boxWidth === null) {
      const initialWidth = element.offsetWidth || rootRef.current?.clientWidth || 0;
      setBoxWidth(clampWidth(initialWidth));
    }

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

    const observer = new ResizeObserver(([entry]) => {
      updateLayout(entry.contentRect.width);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [boxWidth, clampWidth]);

  useEffect(() => {
    const onWindowResize = () => {
      if (boxWidth === null) {
        return;
      }
      setBoxWidth((prev) => clampWidth(prev));
    };

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

    window.addEventListener('resize', onWindowResize);
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
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        background: '#e9e9e9',
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
                    name="name"
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
                    name="category_id"
                    label="分类"
                    rules={[{ required: true, message: '请选择分类' }]}
                  >
                    <Select placeholder="请选择分类" options={categoryOptions} />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item name="publish_time" label="发表时间">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col span={columnSpan}>
                  <Form.Item
                    name="intro"
                    label="说明"
                    rules={[{ required: true, message: '请输入说明' }]}
                  >
                    <Input placeholder="请输入说明" />
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