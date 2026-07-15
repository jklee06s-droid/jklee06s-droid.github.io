const toggleButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (toggleButton && nav) {
  toggleButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      document.body.classList.remove("menu-open");
      toggleButton.setAttribute("aria-expanded", "false");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll("[data-reveal]").forEach((node) => revealObserver.observe(node));

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 10;
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.documentElement.classList.add("js-ready");
