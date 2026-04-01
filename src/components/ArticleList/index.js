import { useCallback, useEffect, useRef, useState } from 'react';
import { Table } from 'antd';
import { getArticleList } from '@/api/article';

const ArticleList = () => {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const resizeRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState(null);
  const [justifyContent, setJustifyContent] = useState('flex-start');
  const [boxHeight, setBoxHeight] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const syncHeightWithSiblings = useCallback(() => {
    const rootElement = rootRef.current;
    const parent = rootElement?.parentElement;
    if (!rootElement || !parent) {
      return;
    }

    let maxSiblingHeight = 0;
    Array.from(parent.children).forEach((child) => {
      if (child !== rootElement && child instanceof HTMLElement) {
        maxSiblingHeight = Math.max(maxSiblingHeight, child.offsetHeight);
      }
    });

    if (maxSiblingHeight > 0) {
      setBoxHeight(maxSiblingHeight);
    }
  }, []);

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
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await getArticleList();
        const list = (res.data || []).map((item) => ({
          key: item.id,
          name: item.name,
          publish_time: item.publish_time,
        }));
        setTableData(list);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    if (boxWidth === null) {
      const initialWidth = element.offsetWidth || rootRef.current?.clientWidth || 0;
      setBoxWidth(clampWidth(initialWidth));
    }

    syncHeightWithSiblings();

    return undefined;
  }, [boxWidth, clampWidth, syncHeightWithSiblings]);

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
        syncHeightWithSiblings();
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
  }, [boxWidth, clampWidth, syncHeightWithSiblings]);

  const tableScrollY = boxHeight ? Math.max(220, boxHeight - 130) : 320;

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
          height: boxHeight ? `${boxHeight}px` : 'auto',
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

        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 12,
          }}
        >
         
          <Table
            dataSource={tableData}
            loading={loading}
            size="small"
            pagination={false}
            scroll={{ y: tableScrollY }}
            columns={[
              { title: '文章名', dataIndex: 'name', key: 'name' },
              { title: '发表时间', dataIndex: 'publish_time', key: 'publish_time' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleList;
