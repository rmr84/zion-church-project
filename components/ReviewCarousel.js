'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

export function ReviewCarousel({ reviews }) {
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, reviews.length - perView);

  useLayoutEffect(() => {
    const query = window.matchMedia('(min-width: 760px)');
    const apply = () => {
      const next = query.matches ? 3 : 1;
      setPerView(next);
      setIndex((current) => Math.min(current, Math.max(0, reviews.length - next)));
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [reviews.length]);

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || maxIndex === 0 || index >= maxIndex) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((current) => Math.min(current + 1, maxIndex));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [paused, index, maxIndex]);

  function move(direction) {
    setIndex((current) => {
      if (direction > 0 && current >= maxIndex) return 0;
      if (direction < 0 && current <= 0) return maxIndex;
      return Math.min(maxIndex, Math.max(0, current + direction));
    });
  }

  function leaveCarousel(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={leaveCarousel}
      onFocus={() => setPaused(true)}
      onBlur={leaveCarousel}
    >
      <button
        className="carousel-button"
        type="button"
        aria-label={index === 0 && maxIndex > 0 ? 'Last reviews' : 'Previous reviews'}
        onClick={() => move(-1)}
        disabled={maxIndex === 0}
      >
        <Chevron direction="left" />
      </button>
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(calc(${index} * -1 * (100% + var(--gap)) / var(--per-view)))` }}
        >
          {reviews.map((review, reviewIndex) => {
            const hidden = reviewIndex < index || reviewIndex >= index + perView;
            return (
              <figure className="review" key={`${review.name}-${review.detail}`} aria-hidden={hidden}>
                <blockquote>
                  <p>{review.quote}</p>
                </blockquote>
                <figcaption>{review.name} · {review.detail}</figcaption>
              </figure>
            );
          })}
        </div>
      </div>
      <button
        className="carousel-button"
        type="button"
        aria-label={index >= maxIndex && maxIndex > 0 ? 'Back to the first reviews' : 'Next reviews'}
        onClick={() => move(1)}
        disabled={maxIndex === 0}
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
}

function Chevron({ direction }) {
  const points = direction === 'left'
    ? '15.5 6.5 8.5 12 15.5 17.5'
    : '8.5 6.5 15.5 12 8.5 17.5';

  return (
    <svg className="carousel-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
