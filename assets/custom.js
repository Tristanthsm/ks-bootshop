/*
  Custom theme extensions for interactive sections
*/

(() => {
  const SELECTORS = {
    beforeAfter: '[data-before-after]',
    timeline: '[data-feature-timeline]'
  };

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value)));

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
  };

  document.addEventListener('DOMContentLoaded', () => {
    initInContext(document);
  });

  document.addEventListener('shopify:section:load', (event) => {
    initInContext(event.target);
  });

  document.addEventListener('shopify:section:select', (event) => {
    initInContext(event.target);
  });
})();
