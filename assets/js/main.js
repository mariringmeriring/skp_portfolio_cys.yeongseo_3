const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) closeMenu();
  });
}

const filterGroups = document.querySelectorAll("[data-filter-group]");

filterGroups.forEach((group) => {
  const buttons = group.querySelectorAll("[data-filter]");
  const targetSelector = group.dataset.filterTarget;
  const targets = document.querySelectorAll(targetSelector);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;

      buttons.forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-pressed", "false");
      });

      button.classList.add("is-active");
      button.setAttribute("aria-pressed", "true");

      targets.forEach((target) => {
        const categories = target.dataset.category.split(" ");
        target.hidden = selected !== "all" && !categories.includes(selected);
      });
    });
  });
});

const yearElement = document.querySelector("[data-current-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

const carousels = document.querySelectorAll("[data-carousel]");

carousels.forEach((carousel) => {
  const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
  const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const currentLabel = carousel.querySelector("[data-carousel-current]");
  const viewer = carousel.querySelector(".cardnews-viewer");
  let currentIndex = 0;
  let touchStartX = 0;

  const showSlide = (nextIndex) => {
    currentIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));

    slides.forEach((slide, index) => {
      const isCurrent = index === currentIndex;
      slide.hidden = !isCurrent;
      slide.setAttribute("aria-hidden", String(!isCurrent));
    });

    dots.forEach((dot, index) => {
      const isCurrent = index === currentIndex;
      dot.classList.toggle("is-active", isCurrent);
      dot.setAttribute("aria-selected", String(isCurrent));
      dot.tabIndex = isCurrent ? 0 : -1;
    });

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;
    currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
  };

  previousButton.addEventListener("click", () => showSlide(currentIndex - 1));
  nextButton.addEventListener("click", () => showSlide(currentIndex + 1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.carouselDot)));
  });

  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(currentIndex + 1);
    }
  });

  viewer.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  viewer.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 50) return;
    showSlide(currentIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });

  showSlide(0);
});
