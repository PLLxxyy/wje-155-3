# 城市公交实时查询系统

一个全栈的城市公交实时查询系统，支持公交线路搜索、实时到站模拟、收藏线路、乘客评价等功能。

## 技术栈

- **前端**：Vite + React 18 + TypeScript
- **后端**：Express + TypeScript + better-sqlite3
- **认证**：JWT + bcryptjs
- **包管理**：npm（monorepo 结构，concurrently 同时启动前后端）

## 启动方式

```bash
# 安装所有依赖（根目录 + server + client）
npm run install:all

# 同时启动前后端
npm run dev
```

启动后：
- 前端访问地址：http://localhost:5173
- 后端 API 地址：http://localhost:3201
- 前端已配置 `/api` 代理到后端 3201 端口
- 可通过 `VITE_PORT`、`VITE_API_PORT`、`PORT` 覆盖默认端口

## 测试账号

| 用户名 | 密码   | 角色     |
|--------|--------|----------|
| user   | 123456 | 普通用户 |
| admin  | 123456 | 管理员   |

## 功能说明

### 普通用户
- **搜索线路**：输入线路号、线路名或站点名称搜索公交线路
- **线路详情**：查看完整站点列表、首末班时间、票价，以及模拟的实时车辆位置
- **收藏线路**：收藏常坐线路，收藏的线路在首页上方显示，无需每次搜索
- **乘客评价**：对每条线路进行等车时间和车厢拥挤程度评分，附带文字评论
- **个人中心**：查看和管理收藏线路、搜索历史记录（支持单条删除和全部清空）

### 管理员（额外功能）
- **线路管理**：新增、编辑、删除公交线路信息（线路名称、编号、首末班时间、票价等）
- **站点管理**：为指定线路添加、删除站点，调整站点顺序和距离

### 实时到站模拟
- 每条线路随机生成 2-4 辆运行中的公交车
- 车辆位置以颜色区分：红色（即将到站，2分钟内）、绿色（较近，5分钟内）、黄色（较远）

## 项目结构

```
wje-155/
├── package.json              # 根 monorepo 配置
├── README.md
├── server/                   # 后端
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express 入口
│       ├── db.ts             # SQLite 数据库初始化 + seed
│       ├── types.ts          # TypeScript 类型定义
│       ├── middleware/
│       │   └── auth.ts       # JWT 认证 + 管理员权限中间件
│       └── routes/
│           ├── auth.ts       # 登录注册
│           ├── busRoutes.ts  # 线路搜索和详情
│           ├── favorites.ts  # 收藏管理
│           ├── reviews.ts    # 乘客评价
│           ├── user.ts       # 用户个人信息
│           └── admin.ts      # 管理员后台 API
└── client/                   # 前端
    ├── package.json
    ├── tsconfig.json
    ├── index.html            # 包含所有全局样式
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx           # 路由 + AuthContext
        ├── api.ts            # API 请求封装
        ├── types.ts          # 前端类型定义
        ├── components/
        │   ├── Header.tsx
        │   ├── ProtectedRoute.tsx
        │   └── AdminRoute.tsx
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            ├── SearchPage.tsx
            ├── BusDetail.tsx
            ├── Profile.tsx
            └── Admin.tsx
```

## 注意事项

1. 首次启动时，数据库会自动建表并写入种子数据（6条公交线路、多个站点、2个测试账号）
2. 车辆到站信息为模拟数据，每次访问随机生成
3. SQLite 数据库文件保存在 `server/bus.db`，删除该文件可重置所有数据
4. 本项目为演示项目，搜索历史会在每次搜索时自动记录（需登录状态）
5. 管理员后台仅限 admin 角色访问，普通用户无法进入
