# Blog React Admin

博客后台管理系统前端项目，基于 React + CRACO + Ant Design。

## 1. 技术栈

- React 19
- React Router
- Axios
- Ant Design
- ECharts
- Less
- CRACO

## 2. 本地开发

### 2.1 安装依赖

```bash
npm install
```

### 2.2 启动开发环境

```bash
npm start
```

默认前端开发服务端口由 CRA/CRACO 自动分配（通常为 3000）。

### 2.3 生产构建

```bash
npm run build
```

构建产物目录为 build。

## 3. 环境变量与地址规则

项目通过 src/config/env.js 统一管理业务接口地址和静态文件地址。

### 3.1 变量说明

- REACT_APP_API_BASE_URL
	- 业务接口根地址（建议包含 /api）
	- 例如：http://47.103.116.170:81/api

- REACT_APP_FILE_BASE_URL
	- 静态文件根地址（通常为 /uploadFiles）
	- 例如：http://47.103.116.170:81/uploadFiles

### 3.2 当前默认兜底逻辑

- 开发环境
	- API 默认：http://127.0.0.1:8081
	- 文件默认：http://127.0.0.1:8081/uploadFiles

- 生产环境
	- API 默认：当前站点域名 + /api
	- 文件默认：当前站点域名 + /uploadFiles

示例：

- 登录接口路径 /user/login
	- 最终地址 = API_BASE_URL + /user/login

- 图片文件名 demo.jpg
	- 最终地址 = FILE_BASE_URL + demo.jpg

## 4. 自动部署（GitHub Actions）

工作流文件：.github/workflows/deploy.yml

触发方式：

- 推送到 main 分支
- 手动触发 workflow_dispatch

部署流程：

1. 拉取代码
2. 安装 Node 20
3. 生成 .env.production
4. 安装依赖并构建
5. 上传 build 到服务器目录

### 4.1  GitHub Secrets

- `REACT_APP_API_BASE_URL` — 业务接口前缀（例如 `http://47.103.116.170:81/api`）
   - `REACT_APP_FILE_BASE_URL ` — 生产静态资源地址（例如 `http://47.103.116.170:81/uploadFiles`）
   - 
 	 以上两个代码中兜底了，如果服务端做了代理，也可不配置。

   - `SERVER_IP` — 服务器地址
   - `SSH_PORT` — SSH 端口
   - `SSH_PRIVATE_KEY` — SSH 私钥
   - `TARGET_DIR` — 服务器项目路径

## 5. 安全建议

- 使用 GitHub Secrets 管理生产地址和凭据
- 若曾提交过敏感配置，建议做历史清理并轮换相关密钥

```

## 7. 目录参考

- src/api：接口封装
- src/pages：页面
- src/layouts：布局
- src/router：路由
- src/config：环境与主题配置
- .github/workflows：自动部署流程
