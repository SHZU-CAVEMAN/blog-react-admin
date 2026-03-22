import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Form, Input, Button, Select, DatePicker, Row, Col  } from "antd";

const ArticleCreate = () => {
  const [content, setContent] = React.useState("**Hello Markdown**");
  const [form] = Form.useForm();
  
  const handleSave = () =>{
      alert("发送请求")
  }
  return (
    <div data-color-mode="light">
       <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="文章标题"
              name="title"
              rules={[{ required: true, message: "请输入标题" }]}
            >
              <Input placeholder="请输入文章标题" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="封面图片地址"
              name="cover"
            >
              <Input placeholder="https://image.xxx.com/a.png" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="分类"
              name="category"
            >
              <Select placeholder="选择分类"
                options={[
                  { value: "frontend", label: "前端" },
                  { value: "backend", label: "后端" },
                  { value: "ai", label: "AI" }
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="发布时间"
              name="date"
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>  
        <Form.Item label="文章内容">
          <MDEditor
            value={content}
            onChange={setContent}
            height={400}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存文章
          </Button>
        </Form.Item>

      </Form>
  
    </div>
  );
};

export default ArticleCreate;