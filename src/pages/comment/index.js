import { useState } from 'react';

const Comment = () =>  {
  const [count, setCount] = useState(0);

  const addWrong = () => {
    // 这两个都基于同一个旧值，结果可能只加 1
    setCount(count + 1);
    setCount(count + 1);
  };

  const addRight = () => {
    // prev 由 React 传入，表示“当前最新旧值”
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    // 结果稳定加 2
  };

  return (
    <div>
      <div>count: {count}</div>
      <button onClick={addWrong}>可能+1</button>
      <button onClick={addRight}>稳定+2</button>
    </div>
  );
}
export default Comment;