(function () {
  "use strict";

  const D = window.ANNIVERSARY_DATA;
  if (!D) {
    console.error("ANNIVERSARY_DATA is missing.");
    return;
  }

  const $ = (id) => document.getElementById(id);
  const allImages = [];
  let lightboxIndex = 0;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr || "";
    return `${date.getFullYear()} · ${String(date.getMonth() + 1).padStart(2, "0")} · ${String(date.getDate()).padStart(2, "0")}`;
  }

  function daysSince(dateStr) {
    const start = new Date(dateStr);
    if (Number.isNaN(start.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  }

  function normalizeAnswer(value) {
    return String(value || "").trim().toLowerCase().replace(/\s/g, "");
  }

  function pushImage(image) {
    const existing = allImages.findIndex((item) => item.src === image.src);
    if (existing === -1) allImages.push(image);
  }

  function makePhotoFigure(image, className) {
    pushImage(image);
    const figure = document.createElement("figure");
    figure.className = className;
    figure.innerHTML = `
      <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.caption)}" loading="lazy" decoding="async">
      <figcaption class="photo-caption">${escapeHtml(image.caption)}</figcaption>
    `;
    const img = figure.querySelector("img");
    img.addEventListener("error", () => {
      img.remove();
      figure.classList.add("photo-missing");
      figure.setAttribute("aria-label", `${image.caption || "照片"}（图片未找到）`);
    });
    figure.addEventListener("click", () => openLightbox(image.src));
    return figure;
  }

  function renderBasics() {
    const meta = D.meta || {};
    document.title = `${meta.title || "WJ & LB"} · 十年纪念`;
    $("heroSubtitle").textContent = meta.subtitle || "2016—2026";
    $("heroTitle").textContent = meta.title || "WJ & LB";
    $("heroTheme").textContent = meta.theme || "年年有今日，岁岁有今朝。";
    $("heroWedding").textContent = `结婚纪念日 ${formatDate(meta.weddingDate)}`;
    $("footerText").textContent = meta.footer || "";

    const days = daysSince(meta.startDate);
    if (days != null) {
      const years = Math.floor(days / 365);
      $("heroCounter").textContent = `相伴 ${days.toLocaleString()} 天 · 约 ${years} 年`;
    }
  }

  function renderGate() {
    const gate = D.gate;
    if (!gate) {
      openSite();
      return;
    }

    $("gateQuestion").textContent = gate.question || "请输入答案";
    $("gateHint").textContent = gate.hint || "";

    const input = $("gateInput");
    const submit = $("gateSubmit");
    const error = $("gateError");
    const answers = Array.isArray(gate.answer) ? gate.answer : [gate.answer];

    function tryOpen() {
      const value = normalizeAnswer(input.value);
      const ok = answers.some((answer) => normalizeAnswer(answer) === value);
      if (ok) {
        openSite();
        return;
      }
      error.textContent = "答案不对，再想想看。";
      input.value = "";
      input.focus();
      input.style.animation = "shake .35s";
      setTimeout(() => { input.style.animation = ""; }, 360);
    }

    submit.addEventListener("click", tryOpen);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") tryOpen();
    });

    if (new URLSearchParams(location.search).has("skip")) {
      setTimeout(openSite, 150);
    } else {
      input.focus();
    }
  }

  function openSite() {
    const gate = $("gate");
    gate.classList.add("is-opening");
    setTimeout(() => {
      gate.classList.add("hidden");
      $("main").classList.remove("hidden");
      setupMusic();
      revealVisible();
    }, 650);
  }

  function renderHeroPhotos() {
    const root = $("heroPhotos");
    root.innerHTML = "";
    (D.heroPhotos || []).forEach((image) => root.appendChild(makePhotoFigure(image, "hero-card")));
  }

  function renderPrologue() {
    $("prologueLines").innerHTML = (D.prologue || [])
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  }

  function renderChapters() {
    const root = $("chapters");
    root.innerHTML = "";
    (D.chapters || []).forEach((chapter) => {
      const article = document.createElement("article");
      article.className = "chapter reveal";
      article.innerHTML = `
        <div class="chapter__year">${escapeHtml(chapter.year)}</div>
        <div class="chapter__copy">
          <p class="eyebrow">${escapeHtml(chapter.kicker || "Chapter")}</p>
          <h3>${escapeHtml(chapter.title)}</h3>
          <p>${escapeHtml(chapter.text)}</p>
        </div>
        <div class="chapter__photos"></div>
      `;
      const photos = article.querySelector(".chapter__photos");
      (chapter.photos || []).forEach((image) => photos.appendChild(makePhotoFigure(image, "chapter-photo")));
      root.appendChild(article);
    });
  }

  function renderAtlas() {
    const root = $("photoAtlas");
    root.innerHTML = "";
    (D.atlas || []).forEach((image) => {
      const item = makePhotoFigure(image, `atlas-item atlas-item--${image.size || "normal"}`);
      root.appendChild(item);
    });
  }

  function renderLetter() {
    const root = $("letter");
    const lines = D.letter || [];
    root.innerHTML = lines.map(() => `<div class="letter__line"></div>`).join("");

    let lineIndex = 0;
    let charIndex = 0;
    let cursor = null;
    let finished = false;
    let started = false;

    function fillAll() {
      finished = true;
      root.querySelectorAll(".letter__line").forEach((lineEl, index) => {
        lineEl.textContent = lines[index] || "";
      });
      if (cursor) cursor.remove();
    }

    root.addEventListener("click", () => {
      if (!finished) fillAll();
    });

    function typeNext() {
      if (finished || lineIndex >= lines.length) {
        if (cursor) cursor.remove();
        return;
      }

      const line = lines[lineIndex];
      const current = root.children[lineIndex];
      if (charIndex === 0) {
        current.textContent = "";
        cursor = document.createElement("span");
        cursor.className = "letter__cursor";
        current.appendChild(cursor);
      }

      if (charIndex < line.length) {
        current.insertBefore(document.createTextNode(line[charIndex]), cursor);
        charIndex += 1;
        const ch = line[charIndex - 1];
        const delay = /[，。？！、\s]/.test(ch) ? 145 : 34;
        setTimeout(typeNext, delay);
      } else {
        lineIndex += 1;
        charIndex = 0;
        setTimeout(typeNext, line ? 260 : 80);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (!started && entries.some((entry) => entry.isIntersecting)) {
        started = true;
        typeNext();
        observer.disconnect();
      }
    }, { threshold: 0.22 });
    observer.observe(root);
  }

  function renderSurprise() {
    const surprise = D.surprise;
    if (!surprise) return;
    const trigger = $("surpriseTrigger");
    const content = $("surpriseContent");
    trigger.textContent = surprise.triggerText || "最后一页";
    content.innerHTML = `
      <h2>${escapeHtml(surprise.title || "下一个十年")}</h2>
      ${(surprise.content || []).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      <p class="finale__signature">${escapeHtml(surprise.signature || "")}</p>
    `;
    trigger.addEventListener("click", () => {
      trigger.classList.add("hidden");
      content.classList.remove("hidden");
    });
  }

  function openLightbox(src) {
    lightboxIndex = allImages.findIndex((image) => image.src === src);
    if (lightboxIndex < 0) lightboxIndex = 0;
    updateLightbox();
    $("lightbox").classList.remove("hidden");
  }

  function updateLightbox() {
    const image = allImages[lightboxIndex];
    if (!image) return;
    $("lightboxImg").src = image.src;
    $("lightboxImg").alt = image.caption || "";
    $("lightboxCaption").textContent = image.caption || "";
  }

  function closeLightbox() {
    $("lightbox").classList.add("hidden");
  }

  function moveLightbox(step) {
    if (!allImages.length) return;
    lightboxIndex = (lightboxIndex + step + allImages.length) % allImages.length;
    updateLightbox();
  }

  function bindLightbox() {
    $("lightboxClose").addEventListener("click", closeLightbox);
    $("lightboxPrev").addEventListener("click", (event) => { event.stopPropagation(); moveLightbox(-1); });
    $("lightboxNext").addEventListener("click", (event) => { event.stopPropagation(); moveLightbox(1); });
    $("lightbox").addEventListener("click", (event) => {
      if (event.target.id === "lightbox") closeLightbox();
    });
    $("lightboxImg").addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("keydown", (event) => {
      if ($("lightbox").classList.contains("hidden")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    });
  }

  function setupMusic() {
    const audio = $("audio");
    const control = $("musicControl");
    const toggle = $("musicToggle");
    const label = $("musicLabel");
    const music = D.music || {};

    if (!music.src) return;

    audio.src = music.src;
    label.textContent = music.title || "音乐";
    control.classList.remove("hidden");

    toggle.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().then(() => toggle.classList.add("is-playing")).catch(() => {});
      } else {
        audio.pause();
        toggle.classList.remove("is-playing");
      }
    });
  }

  function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  function revealVisible() {
    document.querySelectorAll(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add("is-visible");
    });
  }

  function init() {
    renderBasics();
    renderHeroPhotos();
    renderPrologue();
    renderChapters();
    renderAtlas();
    renderLetter();
    renderSurprise();
    bindLightbox();
    setupReveal();
    renderGate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
