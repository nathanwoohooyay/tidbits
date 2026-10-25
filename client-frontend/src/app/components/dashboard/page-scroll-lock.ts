// How long a closing modal takes to animate out (see .modal in styles.css); content stays rendered until then.
export const MODAL_EXIT_MS = 220;

// Locks page scrolling while any modal is open. Counted, so one modal closing can't unlock another.
let openModals = 0;

export function lockPageScroll() {
  if (openModals++ > 0) {
    return;
  }
  // Pad by the scrollbar width so the page doesn't shift sideways when the scrollbar disappears.
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : '';
}

export function unlockPageScroll() {
  if (openModals === 0 || --openModals > 0) {
    return;
  }
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
