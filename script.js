(function () {
  const config = window.AD_CONFIG;
  const slideshow = document.querySelector('.slideshow');
  if (!slideshow) return;

  const defaultDuration = config?.defaultDuration || 15;
  const scriptUrl = config?.driveFolderScriptUrl?.trim();
  const driveUrl = (id) => scriptUrl
    ? `${scriptUrl}?imageId=${encodeURIComponent(id)}`
    : `https://drive.google.com/uc?export=view&id=${id}`;

  function buildSlideshow(files) {
    if (!files?.length) {
      slideshow.innerHTML = '<div class="ad">Add images to your Drive folder or configure file IDs in config.js</div>';
      return;
    }

    slideshow.innerHTML = files.map((file, i) => {
      const id = typeof file === 'string' ? file : file.id;
      const duration = (typeof file === 'object' && file.duration) || defaultDuration;
      const active = i === 0 ? ' active' : '';
      return `<div class="slide${active}" data-duration="${duration}">
        <div class="ad ad-image">
          <img src="${driveUrl(id)}" alt="Ad ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
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

  async function loadFromFolder() {
    const scriptUrl = config?.driveFolderScriptUrl?.trim();
    const folderId = config?.driveFolderId;
    if (scriptUrl && folderId) {
      try {
        const res = await fetch(`${scriptUrl}?folderId=${encodeURIComponent(folderId)}`);
        const files = await res.json();
        if (Array.isArray(files) && !files.error) {
          buildSlideshow(files);
          return;
        }
      } catch (err) {
        console.warn('Could not load from Drive folder:', err);
      }
    }
    if (config?.driveFiles?.length) {
      buildSlideshow(config.driveFiles);
    } else {
      buildSlideshow([]);
    }
  }

  loadFromFolder();
})();
