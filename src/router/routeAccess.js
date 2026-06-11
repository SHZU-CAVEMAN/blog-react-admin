// 路由权限配置
export const routeAccess = {
  "/permission": ["admin"],
  "/article": ["admin"],
  "/message": ["admin"],
  "/comment": ["admin"],
  "/friendLink": ["admin"],
  "/picture": ["admin"],
};

export const getRequiredRoles = (pathname) => {
    // 从权限规则里找出所有能匹配当前地址的路径，选最具体（最长）的那一条
  const matchedPath = Object.keys(routeAccess) 
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return matchedPath ? routeAccess[matchedPath] : null;
};
