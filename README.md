# 个人失物招领联系页面 (Lost & Found Contact Page)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?repo=https://github.com/Guikong001/findmythings/)

---

Tired of writing your phone number or email directly on your belongings? This project provides a secure, dynamic, and privacy-conscious way to create lost-and-found contact pages using Cloudflare Workers and the D1 database.

您是否还在为直接将手机号、邮箱写在个人物品上而感到不安？本项目利用 Cloudflare Workers 和 D1 数据库，提供了一个安全、动态且注重隐私的失物招领联系页面解决方案。

![项目截图](https://i.imgur.com/r62b8g6.png)  
*(您可以将项目运行起来后，替换成您自己的截图)*

## ✨ 功能特性 (Features)

*   **动态生成**: 无需在代码中硬编码您的联系方式。
*   **隐私保护**: 您的电话和邮箱存储在数据库中，不会直接暴露在公开页面。
*   **专属二维码**: 为每个联系方式生成独一无二的二维码，方便打印粘贴。
*   **安全管理**: 通过一个30位的随机密钥来管理您创建的所有联系条目。
*   **完全免费**: 部署在 Cloudflare 的免费套餐上，几乎零成本运行。
*   **一键部署**: 提供 "Deploy to Workers" 按钮，任何人都可以轻松部署自己的版本。

## 🚀 一键部署与设置 (Deployment & Setup)

部署此项目非常简单，您只需要一个 Cloudflare 账户。

### 步骤 1: 点击部署按钮

1.  点击本页面顶部的 **"Deploy to Cloudflare Workers"** 按钮。
2.  使用您的 Cloudflare 账户登录。
3.  Cloudflare 会引导您克隆此仓库并创建一个新的 Worker 项目。您可以为项目取一个新名字。

### 步骤 2: 创建 D1 数据库

1.  在部署过程中，Cloudflare 会检测到 `wrangler.toml` 文件中的 D1 数据库配置。
2.  它会提示您**创建一个新的 D1 数据库**或从现有数据库中选择。请选择创建一个新的数据库，可以将其命名为 `lost-and-found-db`。

### 步骤 3: 初始化数据库表 (部署后必须执行！)

部署成功后，您的 Worker 已经上线，但数据库还是空的。您需要创建 `contacts` 表来存储数据。

1.  在 Cloudflare 控制台中，导航到 **Workers & Pages** -> **D1**。
2.  选择您刚刚创建的 `lost-and-found-db` 数据库。
3.  进入 **控制台 (Console)** 页面。
4.  将下面的 SQL 代码**完整复制**并粘贴到输入框中，然后点击 **执行 (Execute)**。

```sql
-- 本仓库已包含此文件 (schema.sql)，您也可以直接复制下面的内容
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_slug TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_page_slug ON contacts (page_slug);
CREATE INDEX IF NOT EXISTS idx_secret_key ON contacts (secret_key);
```

**恭喜！** 您的失物招领页面服务现在已经完全准备就绪！

## 🛠️ 如何使用 (How to Use)

1.  **创建联系页面**: 访问您部署后的 Worker 地址 (例如 `https://your-worker-name.your-subdomain.workers.dev/`)。
2.  **输入信息**: 在首页表单中输入您的电话号码和邮箱地址，然后点击“生成”。
3.  **保存重要信息**:
    *   **🔑 务必安全地复制并保存您的30位管理密钥！** 这是您后续管理这些信息的唯一凭证，遗失后无法找回。
    *   下载或截图保存您的专属二维码。
4.  **贴上二维码**: 将二维码打印出来，贴在您的贵重物品上，如笔记本电脑、钥匙扣、行李箱等。
5.  **管理信息**: 当您需要查看您创建过的所有联系方式时，请访问 `.../admin` 路径 (例如 `https://your-worker-name.your-subdomain.workers.dev/admin`)，并输入您的管理密钥。

## 💻 技术栈 (Tech Stack)

*   **[Cloudflare Workers](https://workers.cloudflare.com/)**: 用于运行无服务器代码。
*   **[Cloudflare D1](https://developers.cloudflare.com/d1/)**: Cloudflare 的原生无服务器 SQL 数据库。
*   **JavaScript**: 核心编程语言。
*   **[QR Server API](http://goqr.me/api/)**: 用于免费生成二维码。

## 📄 许可证 (License)

此项目使用 [MIT License](./LICENSE) 开源。
