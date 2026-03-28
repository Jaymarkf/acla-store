
// Generic MutationObserver helper
export function obs(selector, callback, options = {}) {
    const target = document.querySelector(selector);
    if (!target) return null;

    const config = {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['value'],
        ...options
    };

    const observer = new MutationObserver(() => callback(target));
    observer.observe(target, config);
    return observer;
}

// Update label attributes based on checked input & current quantity
export function updateLabelAttributes() {
    const $container = $('[data-product-attribute="set-radio"], [data-product-attribute="set-rectangle"]');
    if (!$container.length) return;

    const $checked = $container.find('input:checked');
    if (!$checked.length) return;

    const value = $checked.val();
    const $label = $(`[data-product-attribute-value="${value}"]`);

    const sku = $('[data-product-sku]').text().trim();
    $label.attr('custom-attribute-sku', sku);
}
// Listen for + / - clicks to update quantity attribute
export function attachQuantityButtons() {
    $(document).on('click', '[data-action="inc"], [data-action="dec"]', function () {
        // Wait for Stencil to update the input first
        setTimeout(() => {
            updateLabelAttributes();
        }, 0);
    });
}



// Initialize everything
export function InitCustomFeature() {
    updateLabelAttributes(); // initial sync
    obs('[data-product-sku]', updateLabelAttributes);

}



export function showQtyPopup({ cartQuantity, inputQuantity, itemName, itemSku, onAdd, onReplace,onClose }) {
    const $popup = $('.ec-qty-popup__container');
    const $message = $popup.find('.ec-qty-popup__message');

    // Dynamic message
    $message.text(`You already have ${cartQuantity} of "${itemName}" (SKU: ${itemSku}) in your cart.
Do you want to add it or replace with ${inputQuantity}?`);

    // Buttons
    const $btnAdd = $popup.find('.ec-qty-popup__btn--add');
    const $btnReplace = $popup.find('.ec-qty-popup__btn--replace');
    const $btnClose = $popup.find('.ec-qty-popup__btn--close');

    // Remove previous click handlers
    $btnAdd.off('click');
    $btnReplace.off('click');
    $btnClose.off('click');

    // Attach new handlers
    $btnAdd.on('click', () => { 
        if (typeof onAdd === 'function') onAdd(); 
        $popup.hide(); 
    });

    $btnReplace.on('click', () => { 
        if (typeof onReplace === 'function') onReplace(); 
        $popup.hide(); 
    });

    $btnClose.on('click', () => { 
        if (typeof onClose === 'function') onClose(); 
        $popup.hide(); 
    });

    // Show popup
    $popup.fadeIn(200);
}
