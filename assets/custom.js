/*
  Custom theme extensions for interactive sections
*/

(() => {
  const SELECTORS = {
    beforeAfter: '[data-before-after]',
    timeline: '[data-feature-timeline]',
    floatingStage: '[data-floating-gallery]'
  };

  const state = {
    revealObserver: undefined,
    floatingStage: null,
    galleryFrame: null,
    mutationObserver: null
  };

  const RATIO_PRESETS = ['4 / 5', '1', '3 / 4', '16 / 9', '5 / 4', '2 / 3'];
  const REVEAL_TARGETS = [
    '[data-scroll-reveal]',
    '.hero-carousel .carousel-caption-inner',
    '.section-header',
    '.product-card',
    '.card-list .card',
    '.media-with-text',
    '.newsletter .container',
    '.richtext .rte',
    '.testimonials .card',
    '.before-after-section .before-after-list-item'
  ];

  const deterministicRandom = (seed = 1) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
  };

  const between = (seed, min, max) => deterministicRandom(seed) * (max - min) + min;

  const hashString = (value = '') => {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash) + 1;
  };

  const collectImageSources = (context = document) => {
    const sources = [];

    context.querySelectorAll('img').forEach((img) => {
      const src = img.currentSrc || img.src || img.dataset.src;

      if (!src) {
        return;
      }

      const normalized = src.split('?')[0];
      const widthAttr = Number(img.getAttribute('width') || img.width || 0);

      if (!normalized || sources.includes(normalized) || (widthAttr && widthAttr < 80)) {
        return;
      }

      sources.push(normalized);
    });

    return sources;
  };

  const refreshFloatingGallery = () => {
    if (!state.floatingStage) {
      state.floatingStage = document.querySelector(SELECTORS.floatingStage);
    }

    const stage = state.floatingStage;

    if (!stage) {
      return;
    }

    const sources = collectImageSources(document).slice(0, 14);

    if (!sources.length) {
      stage.innerHTML = '';
      stage.classList.remove('is-visible');
      stage.dataset.gallerySignature = '';
      return;
    }

    const signature = sources.join('|');

    if (stage.dataset.gallerySignature === signature) {
      return;
    }

    stage.innerHTML = '';

    sources.forEach((src, index) => {
      const item = document.createElement('div');
      item.className = 'floating-gallery-item';

      const seed = (index + 1) * Math.PI;
      const top = between(seed * 1.11, 12, 88);
      const left = between(seed * 1.29, 8, 92);
      const scale = between(seed * 1.53, 0.75, 1.35);
      const offsetX = between(seed * 1.71, 12, 38);
      const offsetY = between(seed * 1.93, 16, 44);
      const duration = between(seed * 2.17, 22, 38);
      const delay = between(seed * 2.39, -8, 0);
      const opacity = between(seed * 2.61, 0.22, 0.55);
      const rotation = between(seed * 2.83, -18, 18);
      const rotationBump = between(seed * 3.07, 6, 18);
      const scaleBump = between(seed * 3.29, 0.06, 0.18);
      const imgDuration = between(seed * 3.51, 14, 28);
      const ratio = RATIO_PRESETS[index % RATIO_PRESETS.length];

      item.style.setProperty('--top', `${top.toFixed(2)}%`);
      item.style.setProperty('--left', `${left.toFixed(2)}%`);
      item.style.setProperty('--scale', scale.toFixed(2));
      item.style.setProperty('--offset-x', `${offsetX.toFixed(2)}px`);
      item.style.setProperty('--offset-y', `${offsetY.toFixed(2)}px`);
      item.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      item.style.setProperty('--delay', `${delay.toFixed(2)}s`);
      item.style.setProperty('--opacity', opacity.toFixed(2));
      item.style.setProperty('--rotation', `${rotation.toFixed(2)}deg`);
      item.style.setProperty('--rotation-bump', `${rotationBump.toFixed(2)}deg`);
      item.style.setProperty('--scale-bump', scaleBump.toFixed(2));
      item.style.setProperty('--img-duration', `${imgDuration.toFixed(2)}s`);
      item.style.setProperty('--ratio', ratio);

      const image = document.createElement('img');
      image.src = src;
      image.alt = '';
      image.loading = 'lazy';

      item.appendChild(image);
      stage.appendChild(item);
    });

    stage.dataset.gallerySignature = signature;

    window.requestAnimationFrame(() => {
      stage.classList.add('is-visible');
    });
  };

  const scheduleGalleryUpdate = () => {
    if (state.galleryFrame) {
      window.cancelAnimationFrame(state.galleryFrame);
    }

    state.galleryFrame = window.requestAnimationFrame(() => {
      state.galleryFrame = null;
      refreshFloatingGallery();
    });
  };

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value)));

  const applyCardBackgrounds = (context = document) => {
    const selectors = ['.product-card', '.card-list .card', '.testimonials .card'];

    selectors.forEach((selector) => {
      context.querySelectorAll(selector).forEach((element, index) => {
        const image = element.querySelector('img');

        if (!image) {
          return;
        }

        const src = image.currentSrc || image.src || image.dataset.src;

        if (!src) {
          return;
        }

        const normalized = src.split('?')[0];

        if (!normalized || element.dataset.cardSignature === normalized) {
          return;
        }

        element.dataset.cardSignature = normalized;

        const hash = hashString(normalized) + index;
        const tilt = between(hash * 0.17, -10, 10);
        const safeSrc = normalized.replace(/"/g, '\\"');

        element.style.setProperty('--card-image', `url("${safeSrc}")`);
        element.style.setProperty('--card-tilt', `${tilt.toFixed(2)}deg`);
        element.classList.add('has-animated-preview');
      });
    });
  };

  const ensureRevealObserver = () => {
    if (state.revealObserver !== undefined) {
      return state.revealObserver || null;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.revealObserver = false;
      return null;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');

          if (entry.target.dataset.revealRepeat !== 'true') {
            observer.unobserve(entry.target);
          }
        } else if (entry.target.dataset.revealRepeat === 'true') {
          entry.target.classList.remove('is-revealed');
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -12%'
    });

    state.revealObserver = observer;
    return observer;
  };

  const applyScrollReveal = (context = document) => {
    const elements = new Set();

    REVEAL_TARGETS.forEach((selector) => {
      context.querySelectorAll(selector).forEach((element) => {
        elements.add(element);
      });
    });

    if (!elements.size) {
      return;
    }

    const observer = ensureRevealObserver();
    let index = 0;

    elements.forEach((element) => {
      if (!element.dataset.scrollReveal) {
        element.dataset.scrollReveal = 'true';
      }

      if (!element.dataset.revealOrder) {
        element.dataset.revealOrder = String(index % 8);
      }

      element.style.setProperty('--reveal-order', element.dataset.revealOrder);

      if (observer) {
        observer.observe(element);
      } else {
        element.classList.add('is-revealed');
      }

      index += 1;
    });
  };

  const observeDomMutations = () => {
    if (state.mutationObserver || typeof MutationObserver !== 'function') {
      return;
    }

    const shouldTrigger = (node) => {
      if (!node || node.nodeType !== 1) {
        return false;
      }

      if (node.matches?.('img, picture, .product-card, .card-list .card, .testimonials .card')) {
        return true;
      }

      return Boolean(node.querySelector?.('img, picture, .product-card, .card-list .card, .testimonials .card'));
    };

    state.mutationObserver = new MutationObserver((mutations) => {
      let needsRefresh = false;

      for (const mutation of mutations) {
        if (needsRefresh) {
          break;
        }

        mutation.addedNodes?.forEach((node) => {
          if (needsRefresh) {
            return;
          }

          if (shouldTrigger(node)) {
            needsRefresh = true;
          }
        });
      }

      if (needsRefresh) {
        applyCardBackgrounds(document);
        applyScrollReveal(document);
        scheduleGalleryUpdate();
      }
    });

    state.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  const initBeforeAfter = (container) => {
    if (!container || container.dataset.beforeAfterReady === 'true') {
      return;
    }

    const media = container.querySelector('.before-after-media');
    const after = container.querySelector('.before-after-after');
    const range = container.querySelector('.before-after-range');

    if (!media || !after || !range) {
      return;
    }

    let activePointerId = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setPosition = (value) => {
      const numeric = clamp(value);
      container.style.setProperty('--before-after-position', numeric);
      range.value = numeric;
      if (!prefersReducedMotion) {
        after.style.setProperty('filter', 'saturate(110%)');
        window.clearTimeout(container.__beforeAfterFilterTimeout);
        container.__beforeAfterFilterTimeout = window.setTimeout(() => {
          after.style.removeProperty('filter');
        }, 280);
      }
    };

    const valueFromEvent = (event) => {
      const rect = media.getBoundingClientRect();
      if (!rect.width) {
        return clamp(range.value);
      }

      return clamp(((event.clientX - rect.left) / rect.width) * 100);
    };

    const handlePointerMove = (event) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      setPosition(valueFromEvent(event));
    };

    const handlePointerUp = (event) => {
      if (activePointerId !== event.pointerId) {
        return;
      }

      media.releasePointerCapture?.(activePointerId);
      activePointerId = null;
      media.classList.remove('is-dragging');
    };

    const handlePointerDown = (event) => {
      activePointerId = event.pointerId;
      media.setPointerCapture?.(activePointerId);
      media.classList.add('is-dragging');
      setPosition(valueFromEvent(event));
    };

    const handleClick = (event) => {
      setPosition(valueFromEvent(event));
    };

    const handleRangeInput = (event) => {
      setPosition(event.target.value);
    };

    media.addEventListener('pointerdown', handlePointerDown);
    media.addEventListener('pointermove', handlePointerMove);
    media.addEventListener('pointerup', handlePointerUp);
    media.addEventListener('pointercancel', handlePointerUp);
    media.addEventListener('click', handleClick);
    range.addEventListener('input', handleRangeInput);

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
        setPosition(range.value);
      })
      : null;

    resizeObserver?.observe(media);

    container.__beforeAfterCleanup = () => {
      resizeObserver?.disconnect();
      media.removeEventListener('pointerdown', handlePointerDown);
      media.removeEventListener('pointermove', handlePointerMove);
      media.removeEventListener('pointerup', handlePointerUp);
      media.removeEventListener('pointercancel', handlePointerUp);
      media.removeEventListener('click', handleClick);
      range.removeEventListener('input', handleRangeInput);
      media.classList.remove('is-dragging');
      window.clearTimeout(container.__beforeAfterFilterTimeout);
      after.style.removeProperty('filter');
    };

    setPosition(container.dataset.initial || range.value || 50);
    container.dataset.beforeAfterReady = 'true';
  };

  const initTimeline = (timeline) => {
    if (!timeline || timeline.dataset.timelineReady === 'true') {
      return;
    }

    const steps = Array.from(timeline.querySelectorAll('.feature-timeline-step'));
    if (!steps.length) {
      return;
    }

    steps.forEach((step) => step.classList.remove('is-visible'));

    const animate = timeline.dataset.animate === 'true';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = Number(timeline.dataset.delay || 160);

    const revealAll = () => {
      steps.forEach((step) => step.classList.add('is-visible'));
    };

    if (!animate || prefersReducedMotion) {
      revealAll();
      timeline.dataset.timelineReady = 'true';
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        steps.forEach((step, index) => {
          window.setTimeout(() => {
            step.classList.add('is-visible');
          }, index * delay);
        });

        observer.disconnect();
      });
    }, { threshold: 0.35 });

    observer.observe(timeline);

    timeline.__timelineCleanup = () => {
      observer.disconnect();
    };

    timeline.dataset.timelineReady = 'true';
  };

  const initInContext = (context = document) => {
    context.querySelectorAll(SELECTORS.beforeAfter).forEach((element) => {
      if (typeof element.__beforeAfterCleanup === 'function') {
        element.__beforeAfterCleanup();
        element.dataset.beforeAfterReady = 'false';
      }
      initBeforeAfter(element);
    });

    context.querySelectorAll(SELECTORS.timeline).forEach((element) => {
      if (typeof element.__timelineCleanup === 'function') {
        element.__timelineCleanup();
        element.dataset.timelineReady = 'false';
      }
      initTimeline(element);
    });

    applyCardBackgrounds(context);
    applyScrollReveal(context);
    scheduleGalleryUpdate();
  };

  document.addEventListener('DOMContentLoaded', () => {
    initInContext(document);
    observeDomMutations();
  });

  document.addEventListener('shopify:section:load', (event) => {
    initInContext(event.target);
  });

  document.addEventListener('shopify:section:select', (event) => {
    initInContext(event.target);
  });

  document.addEventListener('shopify:block:select', (event) => {
    if (!event.target) {
      return;
    }

    applyCardBackgrounds(event.target);
    applyScrollReveal(event.target);
    scheduleGalleryUpdate();
  });

  document.addEventListener('shopify:block:deselect', () => {
    scheduleGalleryUpdate();
  });
})();
