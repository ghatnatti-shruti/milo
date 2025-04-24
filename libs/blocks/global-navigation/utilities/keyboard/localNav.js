import { selectors, getNextVisibleItemPosition, getPreviousVisibleItemPosition, getOpenPopup } from './utils.js';
import { trigger } from '../utilities.js';

const focusables = (root) =>
    [...root.querySelectorAll('a[href],button:not([disabled])')];

class LocalNavItem {
  constructor() {
    this.localNav = document.querySelector(selectors.localNav);
    this.localNavTrigger = this.localNav?.querySelector(selectors.localNavTitle);
    this.exitLink = this.localNav?.querySelector(selectors.localNavExit);
    this.addEventListeners();
    this.desktop = window.matchMedia('(min-width: 900px)');
  }

  getState = () => {
    const items = [...document.querySelectorAll(selectors.localNavItems)];
    const openTrigger = document.querySelector(selectors.expandedPopupTrigger);
    const currentEl = document.activeElement
      .closest(selectors.localNavItem)
      ?.querySelector(selectors.localNavItems);

    const curr = items.findIndex((el) => el === currentEl);
    return {
      items,
      curr,
      prev: getPreviousVisibleItemPosition(curr, items),
      next: getNextVisibleItemPosition(curr, items),
      openTrigger,
    };
  };

  open = ({ triggerEl, e } = {}) => {
    const { items, curr } = this.getState();
    const triggerElement = triggerEl || items[curr];
    if (!triggerElement || !triggerElement.hasAttribute('aria-haspopup')) return;
    if (e) e.preventDefault();
    if (triggerElement.getAttribute('aria-expanded') === 'false') {
      trigger({ element: triggerElement, type: 'localNavItem' });
    }
  };
  
  openDropdown = (triggerEl) => {
    this.open({ triggerEl });
  }

  getNavList = () => {
    const navItems = [...document.querySelector('.feds-localnav-items').children];
    const list = [];

    navItems.forEach(item => {
      const trigger  = item.querySelector('a,button');
      if (!trigger) return;

      list.push(trigger);
      if (trigger.matches('[aria-haspopup="true"][aria-expanded="true"]')) {
        list.push(...focusables(item.querySelector('.feds-popup')));
      }
    });
    return list;
  }
  
  navigate = (current, dir) => {
    const allItems = this.getNavList();
    const currIdx = allItems.indexOf(current);
    const isHeader = current.classList.contains('feds-localnav-title')
    if (currIdx === -1 && !isHeader) return;
    const next = allItems[(currIdx + dir + allItems.length) % allItems.length];
    next.focus();

    if (next.matches('[aria-haspopup="true"]')) {
      this.openDropdown(next);
    }
  }

  handleKeyDown = (e) => {
    const { code, target } = e;
    const isHeadline = target.classList.contains(selectors.headline.slice(1));
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

      case 'ArrowDown':
      case 'ArrowUp': {
        e.stopPropagation();
        e.preventDefault();
        const dir = code === 'ArrowDown' ? +1 : -1;
        this.navigate(target, dir);
        break;
      }

      default:
        break;
    }
  };

  addEventListeners = () => {
    this.localNav?.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
    this.exitLink?.addEventListener('focus', (e) => {
      e.preventDefault();
      this.localNavTrigger?.focus();
    });
  };
}

export default LocalNavItem;
