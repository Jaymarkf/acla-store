import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import sideCart from '../f/side-cart';

export const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

export default function (secureBaseUrl, cartId, disableMinicart, enableSideCart) {
    const $cart = $('[data-cart-preview]');

    const $body = $('body');

    $body.on('cart-quantity-update', (event, quantity) => {
        $('.cart-quantity')
            .text(quantity)
            .addClass('countPill--positive');
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }
    });

    function updateCartSize() {
        const getViewHeight = $(window).height();
        $('side-cart').css('max-height', getViewHeight - 20);

        // This line cuts out a five line else-if. It's not meant to be called after being created, just invoked upon birth.
        const sideCartPopulatedCheck = (!$('.side-cart-item').text()) ? $('.side-cart-placeholder').css('display', 'block') : false; // eslint-disable-line no-unused-vars
    }

    // Debouncer fucntion to stop mut catching spam
    function debounce(func, wait, immediate, ...args) {
        let timeout;
        return function bounced() {
            const context = this;
            const later = function timedOut() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    if (disableMinicart === 'true') {
        disableMinicart = true; // eslint-disable-line
    } else {
        // If the side-cart is off or the screen width is l-/e-t large, enable the mini cart. Else, make the cart button a redirect.
        disableMinicart = ($(window).width() <= 1260 || !enableSideCart) ? false : true; // eslint-disable-line

        // Setup a listener to help keep the above keep working as intended in event of screen resize.
        const catchWindowResize = debounce(() => {
            disableMinicart = ($(window).width() <= 1260 || !enableSideCart) ? false : true; // eslint-disable-line
        }, 250);
        $(window).resize(catchWindowResize);

        if (/Mobi/i.test(navigator.userAgent)) {
            $('.dropdown-menu').addClass('mobile-mode');
        }
    }

    $cart.on('click', event => {
        if (!disableMinicart) {
            const $sideCart = $('.side-cart-content');
            const $sideCartDetails = $('.side-cart-details');
            const $sideCartActions = $('.side-cart-actions');

            $('.side-cart-loading').css('display', 'block');
            $('.side-cart-item').css('opacity', '0.5');

            const options = {
                template: {
                    content: 'f/b2b/side-cart-content',
                    details: 'f/b2b/side-cart-details',
                    actions: 'f/b2b/side-cart-actions',
                    counter: 'f/cart/item-count',
                },
            };

            utils.api.cart.getContent(options, (err, response) => {
                if (response.counter > 0) {
                    $sideCart.html(response.content);
                    $sideCartDetails.html(response.details);
                    $sideCartActions.html(response.actions);

                    $('body').trigger('cart-quantity-update', response.counter);
                }

                $('.side-cart-loading').css('display', 'none');
                $('.side-cart-item').css('opacity', '1');

                updateCartSize();
            });

            $('.side-cart-sku-add').css('display', 'none');
            event.preventDefault();
        } else {
            return event.stopPropagation();
        }
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl }, (err, qty) => {
                if (err) {
                    reject(err);
                }
                resolve(qty);
            });
        });

        // If the Cart API gives us a different quantity number, update it
        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('cart-quantity-update', quantity);
    }
    sideCart();
}
