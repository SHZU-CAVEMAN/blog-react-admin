import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import request from "@/api/request";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();

  // 表单状态：邮箱 + 验证码
  const [formData, setFormData] = useState({
    email: "",
    code: "",
  });

  // 验证码倒计时
  const [countDown, setCountDown] = useState(0);
  // 发送按钮是否禁用
  const [sending, setSending] = useState(false);

  // 输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ======================
  // 1. 发送邮箱验证码
  // ======================
  const handleSendCode = async () => {
    const { email } = formData;
    // 校验邮箱
    if (!email) {
      message.warning("请输入邮箱");
      return;
    }
    // 简单邮箱正则
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      message.warning("请输入正确的邮箱格式");
      return;
    }
    try {
      setSending(true);

    //   const { data } = await request.get("/verify/email", {
    //     email: email,
    //   });
    //   console.log("liaohaitao123",data)
    axios({
        method: "post",
        url: "http://127.0.0.1:81/verify/email",
        data: {
            email: email,
        },
    }).then((res) => {
        console.log("已经收到验证码", res.data)
    });

      message.success("验证码发送成功！");
      setCountDown(60);
    } catch (err) {
      message.error("验证码发送失败");
    } finally {
      setSending(false);
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    let timer = null;
    if (countDown > 0) {
      timer = setInterval(() => {
        setCountDown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countDown]);


  // ======================
  // 2. 邮箱登录提交
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, code } = formData;
    // 前端校验
    if (!email || !code) {
      message.warning("邮箱和验证码不能为空");
      return;
    }
    try {
      // 后端的【邮箱登录接口】
        axios({
            method: "post",
            url: "http://127.0.0.1:81/user/login",
            data: {
                account:email,
                password:code
            },
        }).then((res) => {
            console.log("已经收到验证码qw", res.data)
            if (res.data.status === 100) {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("tokenExpire", Date.now() + 3 * 60 * 1000);
                message.success("登录成功");
                navigate("/home");
            }
        });
    } catch (err) {
      message.error("验证码错误或登录失败");
    }
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: "100px auto",
      padding: "20px",
      border: "1px solid #eee",
      borderRadius: "8px"
    }}>
      <h2 style={{ textAlign: "center" }}>后台管理系统 - 登录</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        
        {/* 邮箱 */}
        <div style={{ marginBottom: "15px" }}>
          <label>邮箱：</label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="请输入邮箱"
          />
        </div>

        {/* 验证码 + 发送按钮 */}
        <div style={{
          marginBottom: "15px",
          display: "flex",
          gap: "10px"
        }}>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            style={{ flex: 1, padding: "8px" }}
            placeholder="请输入验证码"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sending || countDown > 0}
            style={{
              padding: "8px 12px",
              backgroundColor: countDown > 0 ? "#ccc" : "#1677ff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: countDown > 0 ? "not-allowed" : "pointer",
            }}
          >
            {countDown > 0 ? `${countDown}秒后重发` : "发送验证码"}
          </button>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#1677ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          登录
        </button>
      </form>
    </div>
  );
};

export default Login;