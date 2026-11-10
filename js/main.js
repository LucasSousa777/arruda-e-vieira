(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* =====================================================
     Abertura: saudação, parede de ripas e entrada do início
     ===================================================== */
  const intro = $('#intro'), wall = $('#introWall'), screen = $('#screen');
  const hr = new Date().getHours();
  $('#introHello').textContent = (hr < 5 ? 'Boa madrugada' : hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite') + '. Seja bem-vindo(a).';

  // persiana de madeira sobre a foto
  const slatCount = innerWidth < 760 ? 7 : 9;
  for (let i = 0; i < slatCount; i++) {
    const s = document.createElement('i');
    s.style.transitionDelay = `${i * 80}ms`;
    screen.appendChild(s);
  }

  const startHero = () => { window.__go = performance.now(); root.classList.add('go'); };

  if (reduce) {
    intro.classList.add('done');
    window.__go = performance.now() - 5000;
    root.classList.add('go');
  } else {
    for (let i = 0; i < 12; i++) {
      const c = document.createElement('i');
      c.style.transitionDelay = `${i * 45}ms`;
      wall.appendChild(c);
    }
    const seen = store.get('av-seen');
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      store.set('av-seen', '1');
      intro.classList.add('open');
      setTimeout(startHero, 500);
      setTimeout(() => intro.classList.add('done'), 2300);
    };
    requestAnimationFrame(() => intro.classList.add('show'));
    setTimeout(open, seen ? 500 : 2400);
    intro.addEventListener('click', open);
    $('#introSkip').addEventListener('click', open);
  }

  /* =====================================================
     Rolagem: um único laço leve para todas as cenas
     ===================================================== */
  const bar = $('#bar'), top = $('#top'), fab = $('#fab');
  const shotIn = $('#shotIn');
  const maniSec = $('#proposito'), maniEl = $('#maniTxt'), mark = $('#maniMark');
  const pc1 = $('#pc1'), pc2 = $('#pc2'), pc1in = $('.pcard__in', pc1);
  const flow = $('#flow'), flowItems = $$('li', flow);
  let ticking = false, contactVisible = false, litCount = 0;

  const words = (() => {
    const parts = maniEl.textContent.trim().split(/\s+/);
    maniEl.textContent = '';
    return parts.map((w) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      maniEl.appendChild(s);
      maniEl.appendChild(document.createTextNode(' '));
      return s;
    });
  })();

  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    const max = root.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    top.classList.toggle('stuck', y > 40);
    fab.classList.toggle('show', y > vh * 0.9 && !contactVisible);

    // propósito: cena fixa, as palavras acendem e o monograma se afasta
    const mr = maniSec.getBoundingClientRect();
    const mp = clamp(-mr.top / Math.max(1, mr.height - vh));
    // foto: desce devagar, mais lento que a página
    if (!reduce && y < vh * 1.3) shotIn.style.transform = `translate3d(0,${Math.min(y * 0.05, 14).toFixed(1)}px,0)`;
    const lit = Math.round(clamp(mp / 0.82) * words.length);
    if (lit !== litCount) {
      const up = lit > litCount;
      for (let i = Math.min(lit, litCount); i < Math.max(lit, litCount); i++) words[i].classList.toggle('on', up);
      litCount = lit;
    }
    if (!reduce && mr.bottom > 0 && mr.top < vh) {
      mark.style.transform = `translate3d(-50%,calc(-50% + ${((0.5 - mp) * 90).toFixed(1)}px),0) scale(${(1 + mp * 0.1).toFixed(3)})`;
    }

    // advogadas: o primeiro cartão recua quando o segundo sobe
    if (!reduce) {
      const r2 = pc2.getBoundingClientRect();
      const p2 = clamp((vh * 0.95 - r2.top) / (vh * 0.65));
      pc1.style.transform = `scale(${(1 - 0.05 * p2).toFixed(4)})`;
      pc1in.style.opacity = (1 - 0.6 * p2).toFixed(3);
    }

    // atendimento: linha desce e o passo mais próximo do centro fica em foco
    const fr = flow.getBoundingClientRect();
    flow.style.setProperty('--p', clamp((vh * 0.55 - fr.top) / fr.height).toFixed(3));
    let best = null, bestD = 1e9;
    flowItems.forEach((li) => {
      const r = li.getBoundingClientRect();
      const d = Math.abs(r.top + Math.min(r.height, 120) / 2 - vh * 0.5);
      if (d < bestD) { bestD = d; best = li; }
    });
    flowItems.forEach((li) => li.classList.toggle('act', li === best && fr.top < vh * 0.7 && fr.bottom > vh * 0.3));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  new IntersectionObserver((e) => { contactVisible = e[0].isIntersecting; onScroll(); }, { threshold: 0.12 }).observe($('#contato'));

  // marcas de confirmação se desenham ao aparecer
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  $$('.proof article').forEach((a) => io.observe(a));

  /* =====================================================
     Rolagem suave (Lenis) e âncoras
     ===================================================== */
  let lenis = null;
  if (window.Lenis && !reduce) {
    try {
      lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }
  const goTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -64, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    setMenu(false);
    setTimeout(() => goTo(t), 120);
  }));

  /* =====================================================
     Menu
     ===================================================== */
  const menu = $('#menu'), burger = $('#burger');
  function setMenu(v) {
    menu.classList.toggle('open', v);
    burger.setAttribute('aria-expanded', String(v));
    burger.setAttribute('aria-label', v ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!v));
    if (lenis) v ? lenis.stop() : lenis.start();
    else document.body.style.overflow = v ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* =====================================================
     Diálogo, copiar OAB
     ===================================================== */
  const sheet = $('#sheet');
  $$('[data-open-wa]').forEach((b) => b.addEventListener('click', () => sheet.showModal()));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

  const toast = $('#toast');
  let tt;
  const say = (m) => { toast.textContent = m; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2600); };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say(`${b.dataset.label} copiado. Confira em cna.oab.org.br`); }
    catch (e) { say(b.dataset.label); }
  }));

  /* =====================================================
     Áreas e dúvidas: abrem e fecham com altura animada
     ===================================================== */
  $$('[data-acc] details, #faq details').forEach((d) => {
    const sum = $('summary', d), box = $(':scope > div', d);
    let anim = null;
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (reduce) { d.open = !d.open; return; }
      if (anim) anim.cancel();
      if (d.open) {
        anim = box.animate({ height: [box.offsetHeight + 'px', '0px'] }, { duration: 380, easing: 'cubic-bezier(.22,.8,.2,1)' });
        anim.onfinish = () => { d.open = false; anim = null; onScroll(); };
      } else {
        d.open = true;
        anim = box.animate({ height: ['0px', box.scrollHeight + 'px'] }, { duration: 460, easing: 'cubic-bezier(.22,.8,.2,1)' });
        anim.onfinish = () => { anim = null; onScroll(); };
      }
    });
  });

  /* =====================================================
     Referência de insalubridade
     ===================================================== */
  const MIN = 1621, out = $('#calcVal');
  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let cur = MIN * 0.4, raf2;
  const animate = (to) => {
    cancelAnimationFrame(raf2);
    const from = cur, t0 = performance.now(), dur = reduce ? 1 : 700;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      cur = from + (to - from) * e; out.textContent = fmt(cur);
      if (p < 1) raf2 = requestAnimationFrame(step);
    };
    raf2 = requestAnimationFrame(step);
  };
  const seg = $$('.seg button');
  seg.forEach((b) => b.addEventListener('click', () => {
    seg.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    animate(MIN * (+b.dataset.pct / 100));
  }));

  $('#year').textContent = new Date().getFullYear();
})();
