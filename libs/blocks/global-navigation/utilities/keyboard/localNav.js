import { selectors, getNextVisibleItemPosition, getPreviousVisibleItemPosition } from './utils.js';
import { closeAllDropdowns, trigger } from '../utilities.js';
import MobilePopup from './mobilePopup.js';

class LocalNavItem {
  constructor() {
    this.localNav = document.querySelector(selectors.localNav);
    this.localNavTrigger = this.localNav?.querySelector(selectors.localNavTitle);
    this.exitLink = this.localNav?.querySelector(selectors.localNavExit);
    this.addEventListeners();
    this.desktop = window.matchMedia('(min-width: 900px)');
    this.mobilePopup = new MobilePopup({ mainNav: this });
  }

  getState = () => {
    const items = [...document.querySelectorAll(selectors.mainNavItems)];
    const openTrigger = document.querySelector(selectors.expandedPopupTrigger);
    const currentEl = document.activeElement
      .closest(selectors.localNavItem)
      ?.querySelector(selectors.mainNavItems);
    const curr = items.findIndex((el) => el === currentEl);
    return {
      items,
      curr,
      prev: getPreviousVisibleItemPosition(curr, items),
      next: getNextVisibleItemPosition(curr, items),
      openTrigger,
    };
  };

  focusCurr = () => {
    const { items, curr } = this.getState();
    items[curr].focus();
  };

  focusPrev = ({ focus } = {}) => {
    const { items, prev } = this.getState();
    const open = document.querySelector(selectors.expandedPopupTrigger);
    // closeAllDropdowns();
    if (prev === -1) return;
    items[prev].focus();
    if (open) {
      this.open({ focus });
    }
  };

  focusNext = () => {
    const { items, next } = this.getState();
    if (next === -1) return;
    console.log(items[next])
    items[next].focus();
  };

  open = ({ focus, triggerEl, e } = {}) => {
    const { items, curr } = this.getState();
    const triggerElement = triggerEl || items[curr];
    if (!triggerElement || !triggerElement.hasAttribute('aria-haspopup')) return;
    if (e) e.preventDefault();
    if (triggerElement.getAttribute('aria-expanded') === 'false') {
      trigger({ element: triggerElement, type: 'localNavItem' });
    }
    // const navItem = triggerElement.parentElement;
    // const popupEl = navItem.querySelector(selectors.popup);
    // if (popupEl) {
    //   if (this.desktop.matches) {
    //     this.popup.open({ focus });
    //   } else {
    //     this.mobilePopup.open({ focus });
    //   }
    //   return;
    // }

    // We need to wait for the popup to be added to the DOM before we can open it.
    // const observer = new MutationObserver(() => {
    //   observer.disconnect();
    //   if (this.desktop.matches) {
    //     this.popup.open({ focus });
    //   } else {
    //     this.mobilePopup.open({ focus });
    //   }
    // });
    // observer.observe(navItem, { childList: true });
  };

  handleKeyDown = (e) => {
    const { code, target } = e;
    const isHeadline = target.classList.contains(selectors.headline.slice(1));
    console.log(code)
    switch (code) {
      case 'Space':
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        if (isHeadline) {
          trigger({ element: target, event: e, type: 'headline' });
        } else {
          e.target.click();
        }
        break;
      case 'Escape': // close on escape
        e.preventDefault();
        if (this.localNav.classList.contains(selectors.localNavActive.slice(1))) {
          this.localNavTrigger?.click();
          this.localNavTrigger?.focus();
        }
        break;

      case 'ArrowDown': {
        e.stopPropagation();
        e.preventDefault();
        const { items, curr } = this.getState();
        if (items[curr] && items[curr].hasAttribute('aria-haspopup')) {
          this.open({ focus: 'first' });
          return;
        }
        this.focusNext();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const { next, prev, openTrigger } = this.getState();
        if (document.dir !== 'rtl') {
          if (next === -1) break;
          this.focusNext();
        } else {
          if (prev === -1) break;
          this.focusPrev({ focus: null });
        }
        if (openTrigger) {
          this.open();
        }
        break;
      }
      default:
        break;
    }
  };

  addEventListeners = () => {
    this.localNav?.addEventListener('keydown', this.handleKeyDown);
    this.exitLink?.addEventListener('focus', (e) => {
      e.preventDefault();
      this.localNavTrigger?.focus();
    });
  };
}

export default LocalNavItem;
