import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <Result
        status="403"
        title="403"
        subTitle="抱歉，你没有权限访问该页面。"
        extra={[
          <Button type="primary" key="home" onClick={() => navigate("/home", { replace: true })}>
            返回首页
          </Button>,
          <Button key="back" onClick={() => navigate(-1)}>
            返回上一页
          </Button>,
        ]}
      />
    </div>
  );
};

export default Forbidden;
