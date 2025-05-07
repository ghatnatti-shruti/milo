import { selectors, getNextVisibleItemPosition, getPreviousVisibleItemPosition } from './utils.js';
import { trigger } from '../utilities.js';

const focusables = (root) => [...root.querySelectorAll('a[href],button:not([disabled])')];
class LocalNavItem {
  constructor() {
    this.localNav = document.querySelector(selectors.localNav);
    this.localNavTrigger = this.localNav?.querySelector(selectors.localNavTitle);
    this.exitLink = this.localNav?.querySelector(selectors.localNavExit);
    this.addEventListeners();
  }

  getState() {
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
      const isHeader = triggerElement.classList.contains('feds-localnav-title');
      if (isHeader) {
        document.querySelector(selectors.localNav).classList.add('feds-localnav--active');
      }
      trigger({ element: triggerElement, type: isHeader ? 'headline' : 'localNavItem' });
    }
  };

  getNavList() {
    const navItems = [...document.querySelector('.feds-localnav-items').children];
    const list = [];

    navItems.forEach((item) => {
      const triggerItem = item.querySelector('a,button');
      if (!triggerItem) return;

      list.push(triggerItem);
      if (triggerItem.matches('[aria-haspopup="true"][aria-expanded="true"]')) {
        list.push(...focusables(item.querySelector('.feds-popup')));
      }
    });
    return list;
  };

  navigate = (current, dir) => {
    const items = this.getNavList();
    const currIdx = items.indexOf(current);
    const isHeader = current.classList.contains('feds-localnav-title');
    const titleBtn = document.querySelector(`${selectors.localNav} > button`);
    if (currIdx === -1 && !isHeader) return;
    if (isHeader) this.open({ triggerEl: current });
    if ((dir === 1 && current === items.at(-1)) || (dir === -1 && current === items.at(0))) {
      titleBtn?.focus();
      return;
    }
    const next = items[(currIdx + dir + items.length) % items.length];
    next.focus();

    if (next.matches('[aria-haspopup="true"]')) {
      const isCollapsed = next.matches('[aria-expanded="false"]');
      this.open({ triggerEl: next });
      // Focus on last item of the dropdown if arrow up
      if (dir === -1 && isCollapsed) {
        const dropdownItems = focusables(next.parentElement.querySelector('.feds-popup'));
        dropdownItems.at(-1)?.focus();
      }
    }
  };

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
    this.localNav?.addEventListener('keydown', this.handleKeyDown);
    this.exitLink?.addEventListener('focus', (e) => {
      e.preventDefault();
      this.localNavTrigger?.focus();
    });
  };
}

export default LocalNavItem;
