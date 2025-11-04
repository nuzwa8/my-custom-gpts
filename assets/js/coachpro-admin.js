/*!
 * CoachPro LMS — Admin/Frontend JS.
 * اس فائل میں (UI), (init* functions), (AJAX/REST) helpers, اور (renderers) شامل ہیں۔
 */
(() => {
  'use strict';

  // --- Guards: soft warnings اگر global دستیاب نہ ہو ---
  const log = (...a) => { try { console.log('[CPL]', ...a); } catch(_){} };
  const warn = (...a) => { try { console.warn('[CPL]', ...a); } catch(_){} };

  // ssmData کو چیک کریں (ajax_url, nonce, caps, is_admin, strings)
  const cfg = (typeof window !== 'undefined' && window.ssmData) ? window.ssmData : null;
  if (!cfg) warn('ssmData غائب ہے۔ (admin_enqueue_scripts) چیک کریں.');

  // --- Utilities ---

  // (mountTemplate): <template id="..."> کو DOM میں کلون کر کے target میں ڈالنا
  function mountTemplate(tplId, target) {
    const tpl = document.getElementById(tplId);
    const host = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!tpl) { warn('template نہیں ملا:', tplId); return null; }
    if (!host) { warn('target نہیں ملا:', target); return null; }
    const node = tpl.content ? tpl.content.cloneNode(true) : null;
    if (!node) { warn('template content خالی ہے:', tplId); return null; }
    host.innerHTML = '';
    host.appendChild(node);
    return host;
  }

  // (wpAjax): (admin-ajax.php) پر محفوظ (POST) کال
  async function wpAjax(action, data = {}, errorMsg = 'درخواست ناکام رہی') {
    if (!cfg || !cfg.ajax_url) throw new Error('ajax_url دستیاب نہیں');
    const body = new URLSearchParams();
    body.set('action', action);
    body.set('nonce', cfg.nonce || '');
    Object.keys(data || {}).forEach(k => body.set(k, data[k]));
    const res = await fetch(cfg.ajax_url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || !json.success) {
      const msg = (json && json.data && json.data.message) ? json.data.message : (cfg?.strings?.error || errorMsg);
      throw new Error(msg);
    }
    return json.data || {};
  }

  // (wpRest): (REST API) helper
  async function wpRest(path, opts = {}) {
    const url = (window.wpApiSettings && window.wpApiSettings.root) ? window.wpApiSettings.root.replace(/\/+$/, '') : window.location.origin + '/wp-json/';
    const full = url + path.replace(/^\/+/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (window.wpApiSettings && window.wpApiSettings.nonce) headers['X-WP-Nonce'] = window.wpApiSettings.nonce;
    const res = await fetch(full, { method: 'GET', credentials: 'same-origin', headers, ...opts });
    if (!res.ok) throw new Error('REST ناکام: ' + res.status);
    return res.json();
  }

  const escapeHtml = s => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const money = (v, cur = 'USD') => {
    const n = Number(v || 0);
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(n); }
    catch(_) { return `${cur} ${n.toFixed(2)}`; }
  };

  // Generic table renderer
  function renderTable(tbody, rows) {
    const el = (typeof tbody === 'string') ? document.querySelector(tbody) : tbody;
    if (!el) return;
    el.innerHTML = rows.join('');
  }

  // Loading state helpers
  function setLoading(container, isLoading) {
    const el = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!el) return;
    el.classList.toggle('is-loading', !!isLoading);
    if (isLoading) {
      if (!el.querySelector('.ssm-loader')) {
        const d = document.createElement('div');
        d.className = 'ssm-loader';
        d.setAttribute('role', 'status');
        d.setAttribute('aria-live', 'polite');
        d.textContent = 'لوڈ ہو رہا ہے…';
        el.appendChild(d);
      }
    } else {
      const l = el.querySelector('.ssm-loader');
      if (l) l.remove();
    }
  }

  // Focus ring helper
  function focusFirstFocusable(root) {
    const el = (typeof root === 'string') ? document.querySelector(root) : root;
    if (!el) return;
    const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const f = el.querySelector(sel);
    if (f) try { f.focus(); } catch(_) {}
  }

  // Environment flags
  const IS_ADMIN = !!cfg?.is_admin;
  const CAPS = cfg?.caps || { manage:false, edit:false, view:false };

  // Expose minimal API on window (debug only)
  window.CPL = Object.assign(window.CPL || {}, {
    mountTemplate, wpAjax, wpRest, renderTable, setLoading, focusFirstFocusable, money, escapeHtml,
    IS_ADMIN, CAPS
  });

    /** Admin Screen Router */
  function initAdminRouter() {
    const root = document.querySelector('#ssm-admin-screen');
    if (!root) return; // frontend میں نظر انداز
    const screen = root.getAttribute('data-screen') || 'coachpro-lms';

    // مختلف (templates) ماؤنٹ کریں
    if (screen === 'coachpro-lms' || screen === 'coachpro-dashboard') initDashboard(root);
    else if (screen === 'coachpro-programs') initPrograms(root);
    else if (screen === 'coachpro-students') initStudents(root);
    else if (screen === 'coachpro-sessions') initSessions(root);
    else if (screen === 'coachpro-assessments') initAssessments(root);
    else if (screen === 'coachpro-reports') initReports(root);
    else if (screen === 'coachpro-settings') initSettings(root);
  }

  // --- Dashboard ---
  async function initDashboard(root) {
    const host = mountTemplate('ssm-tpl-dashboard', root);
    if (!host) return;
    setLoading(host, true);
    try {
      // Programs via REST
      const data = await wpRest('coachpro/v1/programs');
      const items = (data && data.items) || [];
      const kTotalPrograms = host.querySelector('[data-kpi="total_programs"]');
      if (kTotalPrograms) kTotalPrograms.textContent = String(items.length);

      // KPIs placeholders (non-AI): demo from analytics endpoint if available
      let analytics = { items: [] };
      try { analytics = await wpRest('coachpro/v1/analytics'); } catch(_){}
      const kAvg = host.querySelector('[data-kpi="avg_score"]');
      if (kAvg) {
        const avg = analytics.items && analytics.items.length
          ? (analytics.items.reduce((s,r)=>s + Number(r.avg_score||0),0) / analytics.items.length)
          : 0;
        kAvg.textContent = `${Math.round(avg)}%`;
      }
      // Active students/open sessions placeholders:
      const kStudents = host.querySelector('[data-kpi="active_students"]'); if (kStudents) kStudents.textContent = '0';
      const kOpen = host.querySelector('[data-kpi="open_sessions"]'); if (kOpen) kOpen.textContent = '0';

      // Recent enrollments: empty initial
      renderTable(host.querySelector('[data-list="recent_enrollments"]'), []);
      focusFirstFocusable(host);
    } catch (e) {
      warn(e.message || e);
    } finally {
      setLoading(host, false);
    }

    // Actions
    host.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'export-csv') {
        exportCSV([['Feature','Status'],['Export','Ready']], 'dashboard.csv');
      } else if (action === 'new-program') {
        window.location.href = 'post-new.php?post_type=cpl_program';
      }
    });
  }

  // --- Programs ---
  async function initPrograms(root) {
    const host = mountTemplate('ssm-tpl-programs', root);
    if (!host) return;
    const tbody = host.querySelector('[data-list="programs"]');
    const pagination = host.querySelector('[data-ref="pagination"]');
    const search = host.querySelector('[data-ref="search"]');

    let page = 1, perPage = 10, query = '';

    async function load() {
      setLoading(host, true);
      try {
        const data = await wpRest(`coachpro/v1/programs`);
        const items = (data && data.items) || [];
        const filtered = query ? items.filter(x => x.title.toLowerCase().includes(query.toLowerCase())) : items;
        const total = filtered.length;
        const start = (page-1)*perPage;
        const rows = filtered.slice(start, start+perPage).map(p => {
          const price = money(p.price, (window.ssmData && window.ssmData.currency)||'USD');
          return `<tr>
            <td><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a></td>
            <td>${escapeHtml(p.category || '')}</td>
            <td>${escapeHtml(price)}</td>
            <td>—</td>
            <td><a class="button" href="post.php?post=${p.id}&action=edit">Edit</a></td>
          </tr>`;
        });
        renderTable(tbody, rows.length ? rows : ['<tr><td colspan="5">کوئی ریکارڈ نہیں ملا</td></tr>']);
        pagination.innerHTML = paginate(total, page, perPage);
      } catch(e) {
        warn(e.message || e);
        renderTable(tbody, ['<tr><td colspan="5">لوڈنگ میں مسئلہ آیا</td></tr>']);
      } finally {
        setLoading(host, false);
      }
    }

    host.addEventListener('click', (ev) => {
      const el = ev.target.closest('a[data-page], button[data-page]');
      if (el) {
        page = parseInt(el.getAttribute('data-page'), 10) || 1;
        load();
      }
      const btn = ev.target.closest('[data-action]');
      if (btn && btn.getAttribute('data-action') === 'add-program') {
        window.location.href = 'post-new.php?post_type=cpl_program';
      }
    });
    search?.addEventListener('input', () => { page = 1; query = search.value || ''; load(); });

    await load();
    focusFirstFocusable(host);
  }

  // --- Students ---
  async function initStudents(root) {
    const host = mountTemplate('ssm-tpl-students', root);
    if (!host) return;
    const tbody = host.querySelector('[data-list="students"]');
    const pagination = host.querySelector('[data-ref="pagination"]');
    const search = host.querySelector('[data-ref="search"]');

    let page = 1, perPage = 10, query = '';

    async function load() {
      setLoading(host, true);
      try {
        // Use WP users via REST if available, else fallback mock
        const base = (window.wpApiSettings && window.wpApiSettings.root) ? window.wpApiSettings.root : '/wp-json/';
        const res = await fetch(base.replace(/\/+$/,'') + '/wp/v2/users?per_page=100', { credentials: 'same-origin' });
        let users = res.ok ? await res.json() : [];
        users = users.map(u => ({ id:u.id, name:u.name || u.slug, email:(u.slug+'@example.com') })); // email mock if missing
        const filtered = query ? users.filter(x => (x.name+x.email).toLowerCase().includes(query.toLowerCase())) : users;
        const total = filtered.length;
        const start = (page-1)*perPage;
        const rows = filtered.slice(start, start+perPage).map(u => {
          return `<tr>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.email || '')}</td>
            <td>—</td>
            <td>—</td>
            <td><button class="button" data-action="view" data-id="${u.id}">View</button></td>
          </tr>`;
        });
        renderTable(tbody, rows.length ? rows : ['<tr><td colspan="5">کوئی طالب علم نہیں</td></tr>']);
        pagination.innerHTML = paginate(total, page, perPage);
      } catch(e) {
        warn(e.message || e);
        renderTable(tbody, ['<tr><td colspan="5">لوڈنگ میں مسئلہ آیا</td></tr>']);
      } finally {
        setLoading(host, false);
      }
    }

    host.addEventListener('click', (ev) => {
      const el = ev.target.closest('a[data-page], button[data-page]');
      if (el) { page = parseInt(el.getAttribute('data-page'), 10) || 1; load(); }
    });
    search?.addEventListener('input', () => { page = 1; query = search.value || ''; load(); });

    await load();
    focusFirstFocusable(host);
  }

  // --- Sessions (Notes/Chat) ---
  async function initSessions(root) {
    const host = mountTemplate('ssm-tpl-sessions', root);
    if (!host) return;

    const selStudent = host.querySelector('[data-ref="student"]');
    const selProgram = host.querySelector('[data-ref="program"]');
    const messagesBox = host.querySelector('[data-list="messages"]');
    const form = host.querySelector('form[data-ref="composer"]');
    const txt = host.querySelector('textarea[data-ref="message"]');

    // Load students options (simplified)
    await populateUsersSelect(selStudent);
    // Load programs
    const progs = await wpRest('coachpro/v1/programs').catch(()=>({items:[]}));
    (progs.items || []).forEach(p => {
      const o = document.createElement('option'); o.value = p.id; o.textContent = p.title; selProgram.appendChild(o);
    });

    async function refreshMessages() {
      const pid = Number(selProgram.value || 0);
      if (!pid) { messagesBox.innerHTML = '<div class="ssm-empty">پروگرام منتخب کریں</div>'; return; }
      setLoading(messagesBox, true);
      try {
        const data = await wpRest(`coachpro/v1/sessions?program_id=${pid}`);
        const items = data.items || [];
        messagesBox.innerHTML = items.map(m => {
          const meta = m.meta || {};
          const cls = meta.type === 'system' ? 'sys' : (meta.type === 'coach' ? 'coach' : 'user');
          return `<div class="ssm-msg ${cls}">
            <div class="ssm-msg-body">${m.message ? m.message : ''}</div>
            <div class="ssm-msg-meta">${escapeHtml(m.created_at || '')}</div>
          </div>`;
        }).join('') || '<div class="ssm-empty">ابھی کوئی پیغام نہیں</div>';
      } catch(e) {
        messagesBox.innerHTML = '<div class="ssm-error">پیغامات لوڈ نہیں ہوئے</div>';
      } finally {
        setLoading(messagesBox, false);
      }
    }

    // Start session
    host.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-action="start-session"]');
      if (!btn) return;
      const pid = Number(selProgram.value || 0);
      if (!pid) { alert('پروگرام منتخب کریں۔'); return; }
      try {
        await wpAjax('coachpro_start_session', { program_id: pid, coach_id: Number(selStudent.value||0) });
        await refreshMessages();
        if (txt) txt.focus();
      } catch(e) { alert(e.message); }
    });

    // Send message
    form?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const pid = Number(selProgram.value || 0);
      const val = (txt?.value || '').trim();
      if (!pid) { alert('پروگرام منتخب کریں۔'); return; }
      if (!val) { alert('پیغام لکھیں۔'); return; }
      try {
        await wpAjax('coachpro_send_message', { program_id: pid, message: val });
        txt.value = '';
        await refreshMessages();
      } catch(e) { alert(e.message); }
    });

    selProgram.addEventListener('change', refreshMessages);
    await refreshMessages();
    focusFirstFocusable(host);
  }

  // --- Assessments ---
  async function initAssessments(root) {
    const host = mountTemplate('ssm-tpl-assessments', root);
    if (!host) return;
    const tbody = host.querySelector('[data-list="assessments"]');
    setLoading(host, true);
    try {
      // Simplified list using REST programs as holder
      const programs = await wpRest('coachpro/v1/programs');
      const rows = (programs.items || []).map(p => `<tr>
        <td>${escapeHtml(p.title)}</td>
        <td>—</td>
        <td>—</td>
        <td><a class="button" href="post.php?post=${p.id}&action=edit">Manage</a></td>
      </tr>`);
      renderTable(tbody, rows.length ? rows : ['<tr><td colspan="4">کوئی اسیسمنٹ نہیں</td></tr>']);
    } catch(e) {
      renderTable(tbody, ['<tr><td colspan="4">لوڈنگ میں مسئلہ آیا</td></tr>']);
    } finally {
      setLoading(host, false);
    }
    host.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action="new-assessment"]');
      if (btn) alert('نئی اسیسمنٹ کے لیے فارم بلڈر اگلے ورژن میں آئے گا۔');
    });
  }

  // --- Reports ---
  async function initReports(root) {
    const host = mountTemplate('ssm-tpl-reports', root);
    if (!host) return;
    const tbody = host.querySelector('[data-list="reports"]');
    const dtFrom = host.querySelector('[data-ref="from"]');
    const dtTo = host.querySelector('[data-ref="to"]');

    async function run() {
      setLoading(host, true);
      try {
        const q = [];
        if (dtFrom?.value) q.push('from=' + encodeURIComponent(dtFrom.value));
        if (dtTo?.value) q.push('to=' + encodeURIComponent(dtTo.value));
        const data = await wpRest('coachpro/v1/analytics' + (q.length ? ('?' + q.join('&')) : ''));
        const rows = (data.items || []).map(r => `<tr>
          <td>${escapeHtml(String(r.program_id))}</td>
          <td>${escapeHtml(String(r.enrollments))}</td>
          <td>${escapeHtml(String(r.completion_rate))}%</td>
          <td>${escapeHtml(String(r.avg_score))}%</td>
        </tr>`);
        renderTable(tbody, rows.length ? rows : ['<tr><td colspan="4">کوئی ڈیٹا نہیں</td></tr>']);
      } catch(e) {
        renderTable(tbody, ['<tr><td colspan="4">لوڈنگ میں مسئلہ آیا</td></tr>']);
      } finally {
        setLoading(host, false);
      }
    }

    host.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-action]');
      if (!a) return;
      if (a.getAttribute('data-action') === 'run') run();
      if (a.getAttribute('data-action') === 'export') {
        exportCSV([['Program','Enrollments','Completion','Avg Score']], 'reports.csv');
      }
    });

    await run();
    focusFirstFocusable(host);
  }

  // --- Settings ---
  function initSettings(root) {
    const host = mountTemplate('ssm-tpl-settings', root);
    if (!host) return;
    const form = host.querySelector('[data-ref="settings-form"]');
    form?.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-action="save-settings"]');
      if (!btn) return;
      ev.preventDefault();
      const payload = {
        currency: host.querySelector('[data-ref="currency"]')?.value || 'USD',
        program_page: host.querySelector('[data-ref="program_page"]')?.value || '',
        woo_enable: host.querySelector('[data-ref="woo_enable"]')?.checked || false,
        rules_json: host.querySelector('[data-ref="rules_json"]')?.value || '[]'
      };
      setLoading(host, true);
      try {
        await wpRest('coachpro/v1/settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert(cfg?.strings?.saved || 'محفوظ ہو گیا');
      } catch(e) {
        alert(e.message || (cfg?.strings?.error || 'مسئلہ درپیش آیا'));
      } finally {
        setLoading(host, false);
      }
    });
    focusFirstFocusable(host);
  }

    // --- Pagination UI generator ---
  function paginate(total, page, perPage) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    let html = '';
    for (let i=1;i<=pages;i++) {
      html += `<a href="javascript:void(0)" data-page="${i}" class="button ${i===page?'current':''}">${i}</a> `;
    }
    return html || '';
  }

  // CSV Export
  function exportCSV(rows, filename = 'export.csv') {
    const lines = rows.map(r => r.map(x => {
      const s = String(x ?? '');
      return `"${s.replace(/"/g,'""')}"`;
    }).join(','));
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  // Users dropdown helper
  async function populateUsersSelect(selectEl) {
    const base = (window.wpApiSettings && window.wpApiSettings.root) ? window.wpApiSettings.root : '/wp-json/';
    const res = await fetch(base.replace(/\/+$/,'') + '/wp/v2/users?per_page=100', { credentials: 'same-origin' });
    let users = res.ok ? await res.json() : [];
    users = users.map(u => ({ id:u.id, name:u.name || u.slug }));
    const df = document.createDocumentFragment();
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'طالب علم منتخب کریں'; df.appendChild(o0);
    users.forEach(u => { const o = document.createElement('option'); o.value = String(u.id); o.textContent = u.name; df.appendChild(o); });
    selectEl.innerHTML = ''; selectEl.appendChild(df);
  }

  // --- Frontend Shortcodes Mounting ---
  function initShortcodes() {
    // Programs list
    document.querySelectorAll('#ssm-programs-root.ssm-root[data-screen="shortcode-programs"]').forEach(async el => {
      setLoading(el, true);
      try {
        const cat = el.getAttribute('data-category') || '';
        const limit = parseInt(el.getAttribute('data-limit') || '6', 10);
        const cols = Math.min(4, Math.max(1, parseInt(el.getAttribute('data-columns') || '3', 10)));
        const data = await wpRest('coachpro/v1/programs' + (cat ? ('?category=' + encodeURIComponent(cat)) : ''));
        const items = (data.items || []).slice(0, limit);
        const grid = document.createElement('div');
        grid.className = 'ssm-grid cols-' + cols;
        grid.setAttribute('role','list');
        grid.innerHTML = items.map(p => `
          <article class="ssm-card" role="listitem">
            <div class="ssm-card-media">${p.thumb ? `<img src="${escapeHtml(p.thumb)}" alt="">` : ''}</div>
            <div class="ssm-card-body">
              <h3 class="ssm-card-title"><a href="${escapeHtml(p.link)}">${escapeHtml(p.title)}</a></h3>
              <p class="ssm-card-text">${escapeHtml(p.excerpt || '')}</p>
              <div class="ssm-card-actions">
                <button class="button button-primary" data-action="enroll" data-id="${p.id}">اندراج</button>
                <span class="ssm-price">${money(p.price, (window.ssmData && window.ssmData.currency)||'USD')}</span>
              </div>
            </div>
          </article>
        `).join('') || '<div class="ssm-empty">کوئی پروگرام دستیاب نہیں</div>';
        el.appendChild(grid);

        // handle enroll
        grid.addEventListener('click', async (ev) => {
          const btn = ev.target.closest('[data-action="enroll"]');
          if (!btn) return;
          const pid = parseInt(btn.getAttribute('data-id'), 10);
          try {
            await wpAjax('coachpro_enroll_program', { program_id: pid });
            alert('اندراج مکمل ہو گیا');
          } catch(e) {
            alert(e.message);
          }
        });
      } catch(e) {
        el.appendChild(document.createElement('div')).textContent = 'لوڈنگ میں مسئلہ آیا';
      } finally {
        setLoading(el, false);
      }
    });

    // Chat
    document.querySelectorAll('#ssm-chat-root.ssm-root[data-screen="shortcode-chat"]').forEach(el => {
      const wrap = document.createElement('div');
      wrap.className = 'ssm-chatbox';
      wrap.innerHTML = `
        <div class="ssm-messages" data-box></div>
        <form class="ssm-composer" data-form>
          <textarea rows="3" data-message placeholder="پیغام لکھیں…"></textarea>
          <div class="ssm-row">
            <button class="button button-primary" type="submit">بھیجیں</button>
          </div>
        </form>`;
      el.appendChild(wrap);

      const box = wrap.querySelector('[data-box]');
      const form = wrap.querySelector('[data-form]');
      const txt  = wrap.querySelector('[data-message]');
      const pid  = parseInt(el.getAttribute('data-program_id') || '0', 10);

      async function refresh() {
        if (!pid) { box.innerHTML = '<div class="ssm-empty">پروگرام منتخب/مہیا نہیں</div>'; return; }
        setLoading(box, true);
        try {
          const data = await wpRest(`coachpro/v1/sessions?program_id=${pid}`);
          const items = data.items || [];
          box.innerHTML = items.map(m => {
            const meta = m.meta || {};
            const cls = meta.type === 'system' ? 'sys' : (meta.type === 'coach' ? 'coach' : 'user');
            return `<div class="ssm-msg ${cls}">
              <div class="ssm-msg-body">${m.message || ''}</div>
              <div class="ssm-msg-meta">${escapeHtml(m.created_at || '')}</div>
            </div>`;
          }).join('') || '<div class="ssm-empty">ابھی کوئی پیغام نہیں</div>';
          box.scrollTop = box.scrollHeight;
        } catch(e) {
          box.innerHTML = '<div class="ssm-error">پیغامات لوڈ نہیں ہوئے</div>';
        } finally {
          setLoading(box, false);
        }
      }

      // Lazy start session when first send
      form.addEventListener('submit', async ev => {
        ev.preventDefault();
        const val = (txt.value || '').trim();
        if (!val) return;
        try {
          // Ensure session exists
          await wpAjax('coachpro_start_session', { program_id: pid });
        } catch(_) {}
        try {
          await wpAjax('coachpro_send_message', { program_id: pid, message: val });
          txt.value = '';
          await refresh();
        } catch(e) { alert(e.message); }
      });

      refresh();
    });

    // Dashboard (frontend)
    document.querySelectorAll('#ssm-dashboard-root.ssm-root[data-screen="shortcode-dashboard"]').forEach(async el => {
      setLoading(el, true);
      try {
        const data = await wpRest('coachpro/v1/programs');
        const items = (data.items || []);
        const list = document.createElement('div');
        list.className = 'ssm-list';
        list.innerHTML = items.map(p => `
          <div class="ssm-row">
            <div class="ssm-col">
              <a href="${escapeHtml(p.link)}">${escapeHtml(p.title)}</a>
            </div>
            <div class="ssm-col ssm-right">${money(p.price)}</div>
          </div>
        `).join('') || '<div class="ssm-empty">ابھی کوئی اندراج نہیں</div>';
        el.appendChild(list);
      } catch(e) {
        el.appendChild(document.createElement('div')).textContent = 'لوڈنگ میں مسئلہ آیا';
      } finally { setLoading(el, false); }
    });

    // Progress
    document.querySelectorAll('#ssm-progress-root.ssm-root[data-screen="shortcode-progress"]').forEach(async el => {
      const pid = parseInt(el.getAttribute('data-program_id') || '0', 10);
      const box = document.createElement('div'); box.className = 'ssm-progress-box'; el.appendChild(box);
      if (!pid) { box.innerHTML = '<div class="ssm-empty">پروگرام آئی ڈی درکار ہے</div>'; return; }
      setLoading(box, true);
      try {
        const res = await wpAjax('coachpro_get_progress', { program_id: pid }).catch(e => ({ progress:null }));
        const pr = res.progress || { lessons_total:0, lessons_done:0, avg_score:0, last_active:null };
        const pct = pr.lessons_total ? Math.round((pr.lessons_done / pr.lessons_total)*100) : 0;
        box.innerHTML = `
          <div class="ssm-progress-row">
            <div>کُل اسباق: <strong>${escapeHtml(String(pr.lessons_total))}</strong></div>
            <div>مکمل: <strong>${escapeHtml(String(pr.lessons_done))}</strong> (${pct}%)</div>
            <div>اوسط اسکور: <strong>${escapeHtml(String(pr.avg_score))}%</strong></div>
          </div>
          <div class="ssm-progress-bar" aria-label="Progress"><span style="width:${pct}%"></span></div>
        `;
      } catch(e) {
        box.innerHTML = '<div class="ssm-error">پروگریس لوڈ نہیں ہوئی</div>';
      } finally { setLoading(box, false); }
    });

    // Coaches
    document.querySelectorAll('#ssm-coaches-root.ssm-root[data-screen="shortcode-coaches"]').forEach(async el => {
      setLoading(el, true);
      try {
        const spec = el.getAttribute('data-specialty') || '';
        const limit = parseInt(el.getAttribute('data-limit') || '4', 10);
        const data = await wpRest('coachpro/v1/coaches' + (spec ? ('?specialty=' + encodeURIComponent(spec)) : ''));
        const items = (data.items || []).slice(0, limit);
        const grid = document.createElement('div');
        grid.className = 'ssm-grid cols-4';
        grid.setAttribute('role','list');
        grid.innerHTML = items.map(c => `
          <article class="ssm-card" role="listitem">
            <div class="ssm-card-media">${c.thumb ? `<img src="${escapeHtml(c.thumb)}" alt="">` : ''}</div>
            <div class="ssm-card-body">
              <h3 class="ssm-card-title"><a href="${escapeHtml(c.link)}">${escapeHtml(c.title)}</a></h3>
              <p class="ssm-card-text">${escapeHtml(c.excerpt || '')}</p>
            </div>
          </article>
        `).join('') || '<div class="ssm-empty">کوئی کوچ دستیاب نہیں</div>';
        el.appendChild(grid);
      } catch(e) {
        el.appendChild(document.createElement('div')).textContent = 'لوڈنگ میں مسئلہ آیا';
      } finally { setLoading(el, false); }
    });
  }


    // A11y: focus styles via keyboard
  function initFocusVisible() {
    function onKey(e){ if (e.key === 'Tab') document.documentElement.classList.add('user-tabbing'); }
    function onMouse(){ document.documentElement.classList.remove('user-tabbing'); }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onMouse);
  }

  // Global key handlers (e.g., Escape to blur)
  function initGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const a = document.activeElement;
        if (a && typeof a.blur === 'function') a.blur();
      }
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initFocusVisible();
      initGlobalKeys();
      if (IS_ADMIN) initAdminRouter();
      initShortcodes();
    } catch(e) {
      warn('Init error:', e);
    }
  });

})(); // End IIFE



