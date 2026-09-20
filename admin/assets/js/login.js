/* =========================================================
   NOVA — Admin login page
   Shopify-style sign in + first-run setup of the admin account
   ========================================================= */
(function () {
  'use strict';

  const form = document.getElementById('login-form');
  const title = document.getElementById('login-title');
  const sub = document.getElementById('login-sub');
  const errorEl = document.getElementById('login-error');
  const codeInput = document.getElementById('lg-code');
  const passInput = document.getElementById('lg-pass');
  const pass2Wrap = document.getElementById('lg-pass2-wrap');
  const pass2Input = document.getElementById('lg-pass2');
  const btn = document.getElementById('login-btn');

  let setupMode = false;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = setupMode ? 'إنشاء الحساب والدخول' : 'تسجيل الدخول';
  }

  async function applyStatus() {
    try {
      const res = await fetch('/api/auth/status', { cache: 'no-store' });
      const st = await res.json();
      if (st.loggedIn) {
        location.href = '/admin';
        return;
      }
      setupMode = !st.setup;
      title.textContent = setupMode ? 'إنشاء مدير المتجر' : 'تسجيل الدخول';
      sub.textContent = setupMode
        ? 'لا يوجد حساب بعد. أنشئ كودًا وكلمة سر لتملك لوحة التحكم.'
        : 'أدخل كود الدخول وكلمة السر الخاصة بالمتجر.';
      btn.textContent = setupMode ? 'إنشاء الحساب والدخول' : 'تسجيل الدخول';
      pass2Wrap.style.display = setupMode ? 'block' : 'none';

      try {
        const s = await fetch('/api/settings', { cache: 'no-store' }).then((r) => r.json());
        const storeName = (s && s.storeName && String(s.storeName).trim()) || '';
        if (storeName) document.querySelector('.login-name').textContent = storeName;
      } catch (e) { /* keep NOVA */ }
    } catch (e) {
      showError('تعذر الاتصال بالخادم. أعد المحاولة.');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    const code = codeInput.value.trim();
    const password = passInput.value;
    if (!code || !password) {
      showError('أدخل كود الدخول وكلمة السر.');
      return;
    }
    if (setupMode && password.length < 6) {
      showError('كلمة السر يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (setupMode && password !== pass2Input.value) {
      showError('تأكيد كلمة السر غير مطابق.');
      return;
    }
    btn.disabled = true;
    btn.textContent = setupMode ? 'جارٍ الإنشاء…' : 'جارٍ الدخول…';
    try {
      const endpoint = setupMode ? '/api/auth/setup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        location.href = '/admin';
      } else {
        showError(data.error || 'حدث خطأ غير متوقع.');
      }
    } catch (err) {
      showError('تعذر الاتصال بالخادم. أعد المحاولة.');
    }
  });

  applyStatus();
})();