import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />); //render时来自'@testing-library/react' 的函数，将组建渲染到一个虚拟的dom环境里（不是浏览器，而是jset的测试环境）
  const linkElement = screen.getByText(/learn react/i); //在页面中找到包含 learn react 文字的元素
  expect(linkElement).toBeInTheDocument(); // expect是jset的断言函数，toBeInTheDocument是 @testing-library/react 的一个断言方法。
});
// jest是JavaScript的一个测试框架，react官方推荐的测试工具之一，CRA创建react项目时，jest内置。
/*
如写了一个函数：
function sum(a, b) {
  return a + b;
}
测试语句：
test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
运行命令：
npm test
输出：
✓ adds 1 + 2 to equal 3
（表示测试通过）
*/