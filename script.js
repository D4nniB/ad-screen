(function () {
  const config = window.AD_CONFIG;
  const slideshow = document.querySelector('.slideshow');
  if (!slideshow) return;

  const defaultDuration = config?.defaultDuration || 15;
  const scriptUrl = config?.driveFolderScriptUrl?.trim();

  function startSlideshow(items) {
    if (!items?.length) {
      slideshow.innerHTML = '<div class="ad">Add images to ads/ folder and list them in config.js (localImages), or configure Google Drive.</div>';
      return;
    }

    slideshow.innerHTML = items.map((item, i) => {
      const duration = (typeof item === 'object' && item.duration) || defaultDuration;
      const active = i === 0 ? ' active' : '';
      if (item.type === 'iframe') {
        return `<div class="slide${active}" data-duration="${duration}">
          <div class="ad ad-iframe">
            <iframe src="${item.url}" title="Embedded content" allowfullscreen></iframe>
          </div>
        </div>`;
      }
      const src = typeof item === 'string' ? item : item.src || item.id;
      return `<div class="slide${active}" data-duration="${duration}">
        <div class="ad ad-image">
          <img src="${src}" alt="Ad ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
        </div>
      </div>`;
    }).join('');

    const slides = slideshow.querySelectorAll('.slide');
    const progressFill = document.querySelector('.progress-fill');
    let currentIndex = 0;
    let timer = null;

    function getDuration(slide) {
      const sec = parseInt(slide.dataset.duration, 10);
      return Number.isFinite(sec) && sec > 0 ? sec * 1000 : defaultDuration * 1000;
    }

    function goToSlide(index) {
      const next = (index + slides.length) % slides.length;
      slides[currentIndex].classList.remove('active');
      slides[next].classList.add('active');
      currentIndex = next;
      const duration = getDuration(slides[currentIndex]);
      if (timer) clearTimeout(timer);
      if (progressFill) {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        progressFill.offsetHeight;
        progressFill.style.transition = `width ${duration}ms linear`;
        progressFill.style.width = '100%';
      }
      timer = setTimeout(goToNext, duration);
    }

    function goToNext() {
      goToSlide(currentIndex + 1);
    }

    goToSlide(0);
  }

  async function fetchImageAsDataUrl(id) {
    const res = await fetch(`${scriptUrl}?imageId=${encodeURIComponent(id)}`);
    const { mime, data } = await res.json();
    return `data:${mime};base64,${data}`;
  }

  function insertEmbedSlides(items) {
    const embedUrl = config?.embedUrl?.trim();
    if (!embedUrl || !items.length) return items;
    const embedDuration = config?.embedDuration || defaultDuration;
    const merged = [];
    for (let i = 0; i < items.length; i++) {
      merged.push(items[i]);
      if ((i + 1) % 4 === 0) {
        merged.push({ type: 'iframe', url: embedUrl, duration: embedDuration });
      }
    }
    return merged;
  }

  async function loadFromFolder() {
    const folderId = config?.driveFolderId;
    if (scriptUrl && folderId) {
      try {
        const res = await fetch(`${scriptUrl}?folderId=${encodeURIComponent(folderId)}`);
        const files = await res.json();
        if (Array.isArray(files) && !files.error && files.length > 0) {
          slideshow.innerHTML = '<div class="ad">Loading images...</div>';
          const items = await Promise.all(files.map(async (f) => ({
            src: await fetchImageAsDataUrl(f.id),
            duration: defaultDuration,
          })));
          startSlideshow(insertEmbedSlides(items));
          return;
        }
      } catch (err) {
        console.warn('Drive folder fetch failed:', err);
      }
    }
    if (config?.driveFiles?.length && scriptUrl) {
      try {
        slideshow.innerHTML = '<div class="ad">Loading images...</div>';
        const items = await Promise.all(config.driveFiles.map(async (f) => {
          const id = typeof f === 'string' ? f : f.id;
          const dur = typeof f === 'object' && f.duration ? f.duration : defaultDuration;
          return { src: await fetchImageAsDataUrl(id), duration: dur };
        }));
        startSlideshow(insertEmbedSlides(items));
        return;
      } catch (err) {
        console.warn('Drive files fetch failed:', err);
      }
    }
    startSlideshow([]);
  }

  if (config?.localImages?.length) {
    startSlideshow(insertEmbedSlides(config.localImages.map(src => ({ src }))));
  } else {
    loadFromFolder();
  }
})();
