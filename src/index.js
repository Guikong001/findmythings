// 复制并粘贴下面的所有代码到 Cloudflare Worker 编辑器中

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 简单的路由分发
    try {
      if (path === '/' && method === 'GET') {
        return showHomePage();
      }
      if (path === '/' && method === 'POST') {
        return handleFormSubmit(request, env);
      }
      if (path.startsWith('/c/')) {
        const slug = path.split('/').pop();
        return showContactPage(slug, env);
      }
      if (path === '/admin' && method === 'GET') {
        return showAdminLoginPage();
      }
      if (path === '/admin' && method === 'POST') {
        return handleAdminLogin(request, env);
      }
    } catch (e) {
      console.error(e);
      return new Response(`服务器发生错误: ${e.message}`, { status: 500 });
    }

    // 404 Not Found 页面
    return new Response('404: 未找到页面', { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' }});
  },
};

/**
 * 生成指定长度的随机字符串 (URL友好)
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 显示主页，让用户输入信息
 */
function showHomePage() {
  const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>创建您的失物招领页面</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background-color:#f0f2f5;margin:0}.container{background:#fff;padding:2rem 3rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:500px;width:90%;text-align:center}h1{color:#333;margin-bottom:1rem}p{color:#666;margin-bottom:1.5rem}form{display:flex;flex-direction:column;gap:1rem}input{padding:.8rem;border-radius:6px;border:1px solid #ccc;font-size:1rem}button{padding:.9rem;border:none;border-radius:6px;background-color:#007bff;color:white;font-size:1rem;cursor:pointer;transition:background-color .2s}button:hover{background-color:#0056b3}</style></head><body><div class="container"><h1>创建您的专属联系页面</h1><p>输入您的联系方式，系统将为您生成一个专属的二维码联系页面。</p><form method="POST" action="/"><input type="tel" name="phoneNumber" placeholder="电话号码 (例: +8612345678901)" required><input type="email" name="emailAddress" placeholder="邮箱地址" required><button type="submit">生成页面和二维码</button></form></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

/**
 * 处理表单提交，生成页面并存入数据库
 */
async function handleFormSubmit(request, env) {
  const formData = await request.formData();
  const phoneNumber = formData.get('phoneNumber');
  const emailAddress = formData.get('emailAddress');

  if (!phoneNumber || !emailAddress) {
    return new Response('电话号码和邮箱地址不能为空', { status: 400 });
  }

  const pageSlug = generateRandomString(10);
  const secretKey = generateRandomString(30);

  const stmt = env.DB.prepare(
    'INSERT INTO contacts (page_slug, secret_key, phone_number, email_address) VALUES (?, ?, ?, ?)'
  );
  await stmt.bind(pageSlug, secretKey, phoneNumber, emailAddress).run();

  const pageUrl = new URL(request.url).origin + '/c/' + pageSlug;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}`;

  const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>生成成功！</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background-color:#f0f2f5;margin:0;text-align:center;padding:1rem} .container{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:500px;width:100%} .warning{background-color:#fffbe6;border:1px solid #ffe58f;padding:1rem;border-radius:6px;margin:1.5rem 0} .code{background-color:#e9e9e9;padding:.5rem;border-radius:4px;font-family:monospace;word-break:break-all;display:block;text-align:left} img{margin-top:1rem;max-width:100%;height:auto;border:1px solid #ddd} a{color:#007bff;text-decoration:none} a:hover{text-decoration:underline}</style></head><body><div class="container"><h1>🎉 生成成功！</h1><p>请将下面的二维码打印或保存，并贴在您的物品上。</p><p>您的专属联系页面地址是:<br><a href="${pageUrl}" target="_blank">${pageUrl}</a></p><img src="${qrCodeUrl}" alt="联系页面二维码"><div class="warning"><h2>重要：请妥善保管您的管理密钥！</h2><p>这是您未来管理此联系方式的唯一凭证，请勿泄露。</p><code class="code">${secretKey}</code></div><a href="/admin">前往管理页面</a> | <a href="/">创建新的页面</a></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

/**
 * 根据 slug 显示动态联系页面 (已修正)
 */
async function showContactPage(slug, env) {
  if (!slug) return new Response('无效的访问地址', { status: 400 });

  const stmt = env.DB.prepare('SELECT phone_number, email_address FROM contacts WHERE page_slug = ?');
  const contact = await stmt.bind(slug).first();

  if (!contact) {
    return new Response('未找到对应的联系方式，此链接可能已失效。', { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  // ===================== 修正部分开始 =====================
  // 从数据库返回的 contact 对象中，使用正确的带下划线的字段名来获取值
  const phoneNumber = contact.phone_number;
  const emailAddress = contact.email_address;
  // ===================== 修正部分结束 =====================

  const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>失物招领 - 联系方式</title><style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background-color:#f4f7f6;color:#333;box-sizing:border-box} .container{background-color:#fff;border-radius:12px;box-shadow:0 6px 15px rgba(0,0,0,.1);padding:30px;max-width:450px;width:90%;text-align:center} h1{color:#2c3e50;margin-bottom:20px;font-size:1.8em} p{font-size:1.1em;line-height:1.6;margin-bottom:30px;color:#555} .button-group{display:flex;flex-direction:column;gap:15px} .button{display:block;padding:15px 25px;text-decoration:none;color:#fff;border-radius:8px;font-size:1.1em;transition:transform .2s ease-in-out,box-shadow .2s ease-in-out;box-shadow:0 3px 6px rgba(0,0,0,.1);cursor:pointer} .button:hover{transform:translateY(-2px);box-shadow:0 5px 10px rgba(0,0,0,.15)} .phone-button{background-image:linear-gradient(to right,#4CAF50,#66BB6A)} .email-button{background-image:linear-gradient(to right,#007BFF,#1a8bff)}</style></head><body><div class="container"><h1>物品丢失联系页面</h1><p>如果您捡到了我的物品，非常感谢！请通过以下方式联系我：</p><div class="button-group"><a href="tel:${phoneNumber}" class="button phone-button">点击拨打电话</a><a href="mailto:${emailAddress}" class="button email-button">点击发送邮件</a></div><p style="margin-top:30px;font-size:.9em;color:#888">感谢您的帮助！</p></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

/**
 * 显示管理员登录页面
 */
function showAdminLoginPage() {
    const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>管理入口</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background-color:#f0f2f5;margin:0}.container{background:#fff;padding:2rem 3rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:500px;width:90%;text-align:center}h1{color:#333}form{display:flex;flex-direction:column;gap:1rem}input{padding:.8rem;border-radius:6px;border:1px solid #ccc;font-size:1rem}button{padding:.9rem;border:none;border-radius:6px;background-color:#28a745;color:white;font-size:1rem;cursor:pointer;transition:background-color .2s}button:hover{background-color:#218838}</style></head><body><div class="container"><h1>管理员入口</h1><p>请输入您的30位管理密钥以查看您创建的所有联系方式。</p><form method="POST" action="/admin"><input type="text" name="secretKey" placeholder="在此处粘贴您的管理密钥" required pattern="[A-Za-z0-9]{30}" title="请输入30位由字母和数字组成的密钥"><button type="submit">验证并查看</button></form></div></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

/**
 * 处理管理员登录，验证密钥并显示信息
 */
async function handleAdminLogin(request, env) {
    const formData = await request.formData();
    const secretKey = formData.get('secretKey');

    if (!secretKey) {
        return new Response('密钥不能为空', { status: 400 });
    }

    const stmt = env.DB.prepare('SELECT page_slug, phone_number, email_address, created_at FROM contacts WHERE secret_key = ?');
    const { results } = await stmt.bind(secretKey).all();

    let resultHtml;
    if (results && results.length > 0) {
        const origin = new URL(request.url).origin;
        const rows = results.map(r => `<tr><td><a href="${origin}/c/${r.page_slug}" target="_blank">${origin}/c/${r.page_slug}</a></td><td>${r.phone_number}</td><td>${r.email_address}</td><td>${r.created_at}</td></tr>`).join('');
        resultHtml = `<div class="container"><h1>管理面板</h1><p>以下是与此密钥关联的所有联系方式：</p><table><thead><tr><th>联系页面地址</th><th>电话</th><th>邮箱</th><th>创建时间</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:2rem;"><a href="/admin">返回</a> | <a href="/">创建新的页面</a></p></div>`;
    } else {
        resultHtml = `<div class="container"><h1>验证失败</h1><p>无效的管理密钥，或该密钥下没有任何记录。</p><p><a href="/admin">点此重试</a></p></div>`;
    }

    const html = `
    <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>管理面板</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background-color:#f0f2f5;margin:0;padding:2rem} .container{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:900px;margin:0 auto;text-align:center} table{width:100%;border-collapse:collapse;margin-top:1.5rem} th,td{border:1px solid #ddd;padding:.8rem;text-align:left} th{background-color:#f8f9fa} tr:nth-child(even){background-color:#f2f2f2} td a{word-break:break-all} a{color:#007bff;text-decoration:none} a:hover{text-decoration:underline}</style></head><body>${resultHtml}</body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
