const loadScript = (url, type, { mode } = {}) => new Promise((resolve, reject) => {
  let script = document.querySelector(`head > script[src="${url}"]`);
  if (!script) {
    const { head } = document;
    script = document.createElement('script');
    script.setAttribute('src', url);
    if (type) {
      script.setAttribute('type', type);
    }
    if (['async', 'defer'].includes(mode)) script.setAttribute(mode, true);
    head.append(script);
  }

  if (script.dataset.loaded) {
    resolve(script);
    return;
  }

  const onScript = (event) => {
    script.removeEventListener('load', onScript);
    script.removeEventListener('error', onScript);

    if (event.type === 'error') {
      reject(new Error(`error loading script: ${script.src}`));
    } else if (event.type === 'load') {
      script.dataset.loaded = true;
      resolve(script);
    }
  };

  script.addEventListener('load', onScript);
  script.addEventListener('error', onScript);
});

function createTag(tag, attributes, html, options = {}) {
  const el = document.createElement(tag);
  if (html) {
    if (html.nodeType === Node.ELEMENT_NODE
      || html instanceof SVGElement
      || html instanceof DocumentFragment) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  options.parent?.append(el);
  return el;
}

/* eslint import/no-relative-packages: 0 */
export default async function bootstrapBlock(initBlock, blockConfig) {
  const { name, targetEl, layout, noBorder, jarvis } = blockConfig;
  const setNavLayout = () => {
    const element = document.querySelector(targetEl);
    if (layout === 'fullWidth') {
      element.classList.add('feds--full-width');
    }
    if (noBorder) {
      element.classList.add('feds--no-border');
    }
  };

  if (!document.querySelector(targetEl)) {
    const block = createTag(targetEl, { class: name });
    document.body[blockConfig.appendType](block);
  }
  // Configure Unav components and redirect uri
  if (blockConfig.targetEl === 'header') {
    setNavLayout();
    const metaTags = [
      { key: 'gnavSource', name: 'gnav-source' },
      { key: 'unavComponents', name: 'universal-nav' },
      { key: 'redirect', name: 'adobe-home-redirect' },
      { key: 'mobileGnavV2', name: 'mobile-gnav-v2' },
      { key: 'footerSource', name: 'footer-source' },
    ];
    metaTags.forEach((tag) => {
      const { key } = tag;
      if (blockConfig[key]) {
        const metaTag = createTag('meta', {
          name: tag.name,
          content: blockConfig[key],
        });
        document.head.append(metaTag);
      }
    });
    if (blockConfig.isLocalNav) {
      const localNavWrapper = createTag('div', { class: 'feds-localnav' });
      document.querySelector('header').after(localNavWrapper);
    }
  }

  await initBlock(document.querySelector(targetEl));
  if (blockConfig.targetEl === 'footer') {
    const { loadPrivacy } = await import('../scripts/delayed.js');
    setTimeout(() => {
      loadPrivacy(undefined, loadScript);
    }, blockConfig.delay);
  }

  /** Jarvis Chat */
  if (jarvis?.id) {
    const isChatInitialized = (client) => !!client?.isAdobeMessagingClientInitialized();

    const isChatOpen = (client) => isChatInitialized(client) && client?.getMessagingExperienceState()?.windowState !== 'hidden';

    const openChat = (event) => {
      const client = window.AdobeMessagingExperienceClient;

      /* c8 ignore next 4 */
      if (!isChatInitialized(client)) {
        window.location.assign('https://helpx.adobe.com');
        return;
      }

      const open = client?.openMessagingWindow;
      if (typeof open !== 'function' || isChatOpen(client)) {
        return;
      }

      const sourceType = event?.target.tagName?.toLowerCase();
      const sourceText = sourceType === 'img' ? event.target.alt?.trim() : event.target.innerText?.trim();

      open(event ? { sourceType, sourceText } : {});
    };

    const addDomEvents = () => {
      document.addEventListener('click', (event) => {
        if (!event.target.closest('[href*="#open-jarvis-chat"]')) return;
        event.preventDefault();
        openChat(event);
      });
    };

    // Attach DOM events
    addDomEvents();
  }
}
