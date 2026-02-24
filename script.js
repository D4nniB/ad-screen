(function () {
  const config = window.AD_CONFIG;
  const slideshow = document.querySelector('.slideshow');
  if (!slideshow) return;

  const defaultDuration = config?.defaultDuration || 15;
  const scriptUrl = config?.driveFolderScriptUrl?.trim();

  const iframeUrl = 'https://d4nnib.github.io/gym-schedule/';
  const iframeFrequency = 5; // every 5th ad

  // Double-buffering state
  let currentItems = [];
  let nextItems = null;
  let hasPendingSwap = false;
  let globalTimer = null;

  function withEmbeddedIframe(items) {
    const result = [];
    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);
      // After every 4 real ads, insert iframe as the 5th
      if ((i + 1) % (iframeFrequency - 1) === 0) {
        result.push({ iframe: true, src: iframeUrl, duration: defaultDuration });
      }
    }
    return result;
  }

  function renderAndStart(rawItems) {
    const items = withEmbeddedIframe(rawItems);
    currentItems = items;

    if (globalTimer) {
      clearTimeout(globalTimer);
      globalTimer = null;
    }

    if (!items?.length) {
      slideshow.innerHTML =
        '<div class="ad">Add images to ads/ folder and list them in config.js (localImages), or configure Google Drive.</div>';
      return;
    }

    slideshow.innerHTML = items
      .map((item, i) => {
        const src = typeof item === 'string' ? item : item.src || item.id;
        const duration = (typeof item === 'object' && item.duration) || defaultDuration;
        const active = i === 0 ? ' active' : '';
        if (item.iframe) {
          return `<div class="slide${active}" data-duration="${duration}">
            <div class="ad ad-embed">
              <iframe class="ad-iframe" src="${src}" loading="lazy" scrolling="no"></iframe>
            </div>
          </div>`;
        }
        return `<div class="slide${active}" data-duration="${duration}">
          <div class="ad ad-image">
            <img src="${src}" alt="Ad ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
          </div>
        </div>`;
      })
      .join('');

    const slides = slideshow.querySelectorAll('.slide');
    const progressFill = document.querySelector('.progress-fill');
    let currentIndex = 0;

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
      if (globalTimer) clearTimeout(globalTimer);

      if (progressFill) {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        progressFill.offsetHeight;
        progressFill.style.transition = `width ${duration}ms linear`;
        progressFill.style.width = '100%';
      }

      globalTimer = setTimeout(goToNext, duration);
    }

    function goToNext() {
      // At the end of a cycle, if we have a fresh set, swap in seamlessly.
      if (hasPendingSwap && currentIndex === slides.length - 1 && nextItems && nextItems.length) {
        hasPendingSwap = false;
        const swapItems = nextItems;
        nextItems = null;
        renderAndStart(swapItems);
        return;
      }
      goToSlide(currentIndex + 1);
    }

    goToSlide(0);
  }

  async function fetchImageAsDataUrl(id) {
    const res = await fetch(`${scriptUrl}?imageId=${encodeURIComponent(id)}`);
    const { mime, data } = await res.json();
    return `data:${mime};base64,${data}`;
  }

  async function fetchItemsFromDrive() {
    const folderId = config?.driveFolderId;
    if (scriptUrl && folderId) {
      try {
        const res = await fetch(`${scriptUrl}?folderId=${encodeURIComponent(folderId)}`);
        const raw = await res.json();

        // Backend currently returns an object like:
        // { main: [...], gym: [...] } rather than a flat array.
        let files;
        if (Array.isArray(raw)) {
          files = raw;
        } else if (raw && typeof raw === 'object') {
          files = Object.values(raw)
            .flat()
            .filter((f) => f && f.id);
        } else {
          files = [];
        }

        if (Array.isArray(files) && !raw.error && files.length > 0) {
          const items = await Promise.all(files.map(async (f) => ({
            src: await fetchImageAsDataUrl(f.id),
            duration: defaultDuration,
          })));
          return items;
        }
      } catch (err) {
        console.warn('Drive folder fetch failed:', err);
      }
    }
    if (config?.driveFiles?.length && scriptUrl) {
      try {
        const items = await Promise.all(config.driveFiles.map(async (f) => {
          const id = typeof f === 'string' ? f : f.id;
          const dur = typeof f === 'object' && f.duration ? f.duration : defaultDuration;
          return { src: await fetchImageAsDataUrl(id), duration: dur };
        }));
        return items;
      } catch (err) {
        console.warn('Drive files fetch failed:', err);
      }
    }
    return [];
  }

  async function loadFromFolder() {
    slideshow.innerHTML = '<div class="ad">Loading images...</div>';
    const items = await fetchItemsFromDrive();
    renderAndStart(items);
  }

  // Initial load
  if (config?.localImages?.length) {
    renderAndStart(config.localImages);
  } else {
    loadFromFolder();
  }

  // Background refresh: reload ads periodically without interrupting current cycle
  const refreshMs = (config?.refreshMs || 5) * 60 * 1000; // minutes → ms
  if (!Number.isNaN(refreshMs) && refreshMs > 0 && scriptUrl) {
    setInterval(async () => {
      try {
        const items = await fetchItemsFromDrive();
        if (items && items.length) {
          nextItems = items;
          hasPendingSwap = true; // will swap at end of current cycle
        }
      } catch (err) {
        console.warn('Background refresh failed:', err);
      }
    }, refreshMs);
  }
})();
