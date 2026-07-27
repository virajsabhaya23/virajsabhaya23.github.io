const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".site-nav a");

const setActiveSection = () => {
  const scrollY = window.scrollY + 120;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const id = section.getAttribute("id");
    const matchingLink = document.querySelector(`.site-nav a[href="#${id}"]`);

    if (!matchingLink) {
      return;
    }

    if (scrollY >= top && scrollY < bottom) {
      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      matchingLink.setAttribute("aria-current", "page");
    }
  });
};

setActiveSection();
window.addEventListener("scroll", setActiveSection, { passive: true });