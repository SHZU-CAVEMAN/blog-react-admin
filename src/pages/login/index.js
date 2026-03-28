import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import request from "@/api/request";
import "./index.less"
import logoImg from "@/assets/logoimage.png"; 

const Login = () => {
    const navigate = useNavigate();

    // 切换登录模式：true=验证码登录 / false=账号密码登录
    const [isCodeLogin, setIsCodeLogin] = useState(true);

    // 表单状态
    const [formData, setFormData] = useState({
        email: "",
        code: "",
        username: "",
        password: "",
    });

    // 验证码倒计时
    const [countDown, setCountDown] = useState(0);
    const [sending, setSending] = useState(false);

    // 输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 发送邮箱验证码
    const handleSendCode = async () => {
        const { email } = formData;
        if (!email) {
            message.warning("请输入邮箱");
            return;
        }
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(email)) {
            message.warning("请输入正确的邮箱格式");
            return;
        }
        try {
            setSending(true);
            await request.post("/verify/email", { email });
            message.success("验证码发送成功！");
            setCountDown(60);
        } catch (err) {
            message.error("发送失败");
        } finally {
            setSending(false);
        }
    };

    // 倒计时
    useEffect(() => {
        let timer = null;
        if (countDown > 0) {
            timer = setInterval(() => {
                setCountDown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countDown]);

    // 登录提交
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isCodeLogin) {
            // 邮箱验证码登录
            const { email, code } = formData;
            if (!email || !code) {
                message.warning("请完整填写");
                return;
            }
            try {
                const res = await request.post("/user/login", {
                    account: email,
                    password: code,
                });
                if (res.status === 100) {
                    localStorage.setItem("token", res.token);
                    localStorage.setItem("tokenExpire", Date.now() + 2 * 60 * 60 * 1000);
                    message.success(res.msg);
                    navigate("/home");
                } else {
                    message.error(res.msg);
                }
            } catch (err) {
                message.error("登录失败");
            }
        } else {
            // 账号密码登录
            const { username, password } = formData;
            if (!username || !password) {
                message.warning("请输入账号密码");
                return;
            }
            try {
                const res = await request.post("/user/login", {
                    account: username,
                    password: password,
                });
                if (res.status === 100) {
                    localStorage.setItem("token", res.token);
                    localStorage.setItem("tokenExpire", Date.now() + 2 * 60 * 60 * 1000);
                    message.success(res.msg);
                    navigate("/home");
                } else {
                    message.error(res.msg);
                }
            } catch (err) {
                message.error("账号或密码错误");
            }
        }
    };

    // 🔥 切换登录方式
    const toggleLoginMode = () => {
        setIsCodeLogin(!isCodeLogin);
        setFormData({
            email: "",
            code: "",
            username: "",
            password: "",
        });
        setCountDown(0);
    };

    return (
        <div style={{
                maxWidth: "400px",
                margin: "100px auto",
                padding: "20px",
                border: "1px solid #c6c6c6",
                borderRadius: "8px",
            }}
        >
            <div style={{
                textAlign: "center",
                marginBottom: 16,
            }}>
                <img 
                    src={logoImg} 
                    alt="logo" 
                    style={{
                        width: 80,        // 你可以改大小
                        height: 80,       // 高宽等比例就行
                        borderRadius: "50%",
                        border: "1px solid #eee"
                    }}
                />
            </div>
            <h3 style={{ textAlign: "center" }}>后台管理系统 - 登录</h3>

            {/* 🔥 单个切换文本，同一个位置点击切换 */}
            <div className="toggle-login-mode"
                 onClick={toggleLoginMode}>
                {isCodeLogin ? "邮箱验证码登录" : "账号密码登录"}
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
                {isCodeLogin ? (
                    // 邮箱验证码登录
                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: "100%", padding: "8px",  boxSizing: "border-box" }}
                                placeholder="请输入邮箱"
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginBottom: 15 }}>
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
                                    backgroundColor: sending || countDown > 0 ? "#ccc" : "#1677ff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: sending || countDown > 0 ? "not-allowed" : "pointer",
                                }}
                            >
                                {countDown > 0 ? `${countDown}秒` : "发送验证码"}
                            </button>
                        </div>
                    </div>
                ) : (
                    // 账号密码登录
                    <div>
                        <div style={{ marginBottom: "15px" }}>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                style={{ width: "100%", padding: "8px" ,  boxSizing: "border-box"}}
                                placeholder="请输入账号"
                            />
                        </div>
                        <div style={{  gap: "10px", marginBottom: 15}}>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ width: "100%", padding: "8px" ,  boxSizing: "border-box"}}
                                placeholder="请输入密码"
                            />
                        </div>
                    </div>
                )}

                {/* 登录按钮 */}
                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#1677ff",
                        //backgroundColor: "#1c8139",
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