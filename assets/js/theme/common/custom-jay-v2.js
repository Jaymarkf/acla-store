export function InitCustomFeature(){
      let selector;

      const $radio = $('[data-product-attribute="set-radio"]');
      const $rectangle = $('[data-product-attribute="set-rectangle"]');

      if ($radio.length) {
      selector = $radio;
      obs('[data-product-sku]', (element) => {
      const newSku = element.textContent.trim();
      console.log('SKU changed:', newSku);
      // Your custom logic here
      });
      } else if ($rectangle.length) {
      selector = $rectangle;

      } else {
      selector = null; // or handle fallback here
      }
}



export function obs(selector, callback, options = {}) {
    const defaultOptions = {
        childList: true,
        subtree: true,
        characterData: true,
    };

    const config = { ...defaultOptions, ...options };

    const target = document.querySelector(selector);

    if (!target) {
        console.warn(`MutationObserver: Element not found for selector ${selector}`);
        return null;
    }

    const observer = new MutationObserver((mutations) => {
        callback(target, mutations);
    });

    observer.observe(target, config);

    return observer;
}