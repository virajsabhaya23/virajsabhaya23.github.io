const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".site-nav a");
const siteHeader = document.querySelector(".site-header");

const setActiveSection = () => {
  const scrollY = window.scrollY + siteHeader.offsetHeight + 40;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress);

  navLinks.forEach((link) => link.removeAttribute("aria-current"));
  sections.forEach((section) => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const id = section.getAttribute("id");
    const matchingLink = document.querySelector(`.site-nav a[href="#${id}"]`);

    if (!matchingLink) {
      return;
    }

    if (scrollY >= top && scrollY < bottom) {
      matchingLink.setAttribute("aria-current", "page");
    }
  });
};

setActiveSection();
window.addEventListener("scroll", setActiveSection, { passive: true });
new ResizeObserver(() => {
  document.documentElement.style.scrollPaddingTop = `${siteHeader.offsetHeight + 24}px`;
  setActiveSection();
}).observe(siteHeader);

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll(
  ".hero__content > *, .hero__image-frame, .section-heading, .section__grid > *, " +
  ".split-section__intro, .metric-card, .timeline-item, .work-feature, .project-card, " +
  ".credential-card, .recognition-item, .contact-card > *"
);
const revealedElements = new WeakSet();
const activeReveals = new Map();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    const element = entry.target;
    revealObserver.unobserve(element);
    revealedElements.add(element);

    if (motionPreference.matches || element.contains(document.activeElement)) {
      return;
    }

    const siblingIndex = Array.from(element.parentElement.children).indexOf(element);
    const animation = element.animate(
      [{ opacity: 0, translate: "0 18px" }, { opacity: 1, translate: "0 0" }],
      {
        duration: 650,
        delay: Math.min(siblingIndex, 4) * 70,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "backwards"
      }
    );
    activeReveals.set(element, animation);
    animation.onfinish = animation.oncancel = () => activeReveals.delete(element);
  });
}, { threshold: 0.06, rootMargin: "0px 0px -24px 0px" });

const configureReveals = () => {
  revealObserver.disconnect();
  activeReveals.forEach((animation) => animation.cancel());
  activeReveals.clear();

  if (!motionPreference.matches) {
    revealTargets.forEach((element) => {
      if (!revealedElements.has(element)) {
        revealObserver.observe(element);
      }
    });
  }
};

document.addEventListener("focusin", (event) => {
  activeReveals.forEach((animation, element) => {
    if (element.contains(event.target)) {
      animation.cancel();
    }
  });
});
motionPreference.addEventListener("change", configureReveals);
configureReveals();

const testimonialMarquee = document.querySelector(".testimonial-marquee");
const testimonialArrows = document.querySelectorAll("[data-testimonial-direction]");

if (testimonialMarquee && testimonialArrows.length) {
  const track = testimonialMarquee.querySelector(".testimonial-track");
  const group = track.querySelector(".testimonial-group");
  const cards = Array.from(group.children);
  const dialog = document.querySelector(".recommendation-dialog");
  const pixelsPerSecond = 32;

  group.querySelectorAll("[data-read-recommendation]").forEach((button) => {
    const card = button.closest(".testimonial-card");
    const quote = card.querySelector(".testimonial-card__quote");
    const preview = document.createElement("p");
    preview.className = "testimonial-card__preview";
    preview.textContent = card.dataset.preview || Array.from(quote.children, (paragraph) => paragraph.textContent.trim()).join(" ");
    quote.before(preview);
    quote.hidden = true;
    button.hidden = false;
  });
  testimonialArrows.forEach((button) => {
    button.hidden = false;
  });
  testimonialMarquee.classList.add("is-enhanced");

  const duplicate = group.cloneNode(true);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animation;
  let focused = false;
  let inView = false;

  duplicate.setAttribute("aria-hidden", "true");
  duplicate.querySelectorAll("button").forEach((button) => {
    button.tabIndex = -1;
  });
  track.append(duplicate);

  const updatePlayback = () => {
    if (!animation) {
      return;
    }

    if (!inView || focused || dialog.open || document.hidden) {
      animation.pause();
    } else {
      animation.play();
    }
  };

  const configureAnimation = () => {
    const previousDuration = animation?.effect.getTiming().duration;
    const progress = previousDuration ? (animation.currentTime % previousDuration) / previousDuration : 0;
    animation?.cancel();
    const visibleCards = window.innerWidth >= 1200 ? 3 : window.innerWidth >= 760 ? 2 : 1;
    const gap = parseFloat(getComputedStyle(group).columnGap);
    const cardWidth = (testimonialMarquee.clientWidth - gap * (visibleCards - 1)) / visibleCards;
    testimonialMarquee.style.setProperty("--testimonial-card-width", `${cardWidth}px`);
    group.style.paddingRight = reducedMotion.matches ? `${Math.max(gap, testimonialMarquee.clientWidth - cardWidth)}px` : "";
    duplicate.hidden = reducedMotion.matches;
    testimonialMarquee.classList.toggle("is-animated", !reducedMotion.matches);

    if (reducedMotion.matches) {
      animation = undefined;
      return;
    }

    testimonialMarquee.scrollLeft = 0;
    const distance = group.getBoundingClientRect().width;
    const duration = distance / pixelsPerSecond * 1000;
    animation = track.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(-${distance}px)` }],
      { duration, iterations: Infinity, easing: "linear" }
    );
    animation.currentTime = progress * duration;
    updatePlayback();
  };

  const moveRecommendation = (direction) => {
    const step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(group).columnGap);
    const distance = step * cards.length;
    const position = animation
      ? animation.currentTime / 1000 * pixelsPerSecond % distance
      : testimonialMarquee.scrollLeft;
    const currentIndex = Math.round(position / step) % cards.length;
    const nextIndex = (currentIndex + direction + cards.length) % cards.length;

    if (animation) {
      animation.currentTime = cards[nextIndex].offsetLeft / pixelsPerSecond * 1000;
      testimonialMarquee.scrollLeft = 0;
      updatePlayback();
    } else {
      testimonialMarquee.scrollTo({ left: cards[nextIndex].offsetLeft, behavior: "instant" });
    }
  };

  testimonialArrows.forEach((button) => {
    button.addEventListener("click", () => moveRecommendation(Number(button.dataset.testimonialDirection)));
  });

  testimonialMarquee.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveRecommendation(event.key === "ArrowLeft" ? -1 : 1);
    }
  });

  track.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-read-recommendation]") && duplicate.contains(event.target)) {
      event.preventDefault();
    }
  });

  track.addEventListener("click", (event) => {
    const button = event.target.closest("[data-read-recommendation]");
    if (!button) {
      return;
    }

    const card = button.closest(".testimonial-card");
    dialog.querySelector("#recommendation-author").textContent = card.querySelector(".testimonial-card__author").textContent;
    dialog.querySelector(".recommendation-dialog__role").textContent = card.querySelector(".testimonial-card__role").textContent;
    dialog.querySelector(".recommendation-dialog__quote").replaceChildren(
      ...Array.from(card.querySelector(".testimonial-card__quote").children, (paragraph) => paragraph.cloneNode(true))
    );
    dialog.showModal();
    updatePlayback();
  });

  dialog.querySelector(".recommendation-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    }
  });
  dialog.addEventListener("close", updatePlayback);

  testimonialMarquee.addEventListener("focusin", (event) => {
    focused = event.target.matches(":focus-visible");
    if (focused && animation && event.target.matches("[data-read-recommendation]")) {
      animation.currentTime = event.target.closest(".testimonial-card").offsetLeft / pixelsPerSecond * 1000;
      testimonialMarquee.scrollLeft = 0;
    }
    updatePlayback();
  });
  testimonialMarquee.addEventListener("focusout", (event) => {
    focused = testimonialMarquee.contains(event.relatedTarget) && event.relatedTarget.matches(":focus-visible");
    updatePlayback();
  });

  reducedMotion.addEventListener("change", configureAnimation);
  document.addEventListener("visibilitychange", updatePlayback);
  new ResizeObserver(configureAnimation).observe(testimonialMarquee);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  }).observe(testimonialMarquee);
  configureAnimation();
}