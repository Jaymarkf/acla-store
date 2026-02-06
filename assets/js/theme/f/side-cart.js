import utils from '@bigcommerce/stencil-utils';
import request from './request';
import autoHighlight from './auto-highlight';
import itemInCart from './card-item-in-cart';

export default function sideCart() {
    // Set up the mutable page height by grabbing it and the cart height then modifying based on one another
    // Also grab viewport height so we can create a scrollable inner element
    let getPageHeight = $('.page').height();
    let getCartHeight = $('.side-cart').height();

    // Only mut the height of elements if not on a mobile device
    if (!/Mobi/i.test(navigator.userAgent)) {
        $('#side-cart-container .side-cart-container').css('height', getPageHeight);
    }

    // Quick-Add SKU handler
    const $form = $('.quick-add');

    // Set up the sticky-ness of the side-cart
    const Sticky = require('sticky-js');
    const sticky = new Sticky('#side-cart-container');

    // Update the cart size/dimensions function
    function updateCartSize() {
        // Mut the page height to better contain the side-cart
        getPageHeight = $('.page').height();
        getCartHeight = $('#side-cart-container').height();

        // Check for the existence of the data-sticky-contianer tag to make sure we should mut the page
        const getPageType = $('.page').attr('data-sticky-container');

        if (getPageType && ($(window).width() > 1260)) {
            if (getPageHeight < 685) {
                sticky.destroy();
            }

            if (getCartHeight > 685 && getPageHeight < 734) {
                $('.page-content').css('min-height', getCartHeight + 49);
                $('.side-cart-container').css('min-height', getCartHeight + 26);
            } else {
                switch (getCartHeight > getPageHeight) {
                case true:
                    $('#side-cart-container .side-cart-container').css('min-height', getCartHeight);
                    $('.page-content').css('min-height', getCartHeight + 40);
                    break;
                case false:
                    $('.page-content').css('min-height');
                    sticky.update();
                    break;
                default:
                }
            }
        }

        // This line cuts out a five line else-if. It's not meant to be called after being created, just invoked upon birth.
        const sideCartPopulatedCheck = (!$('.side-cart-item').text()) ? $('.side-cart-placeholder').css('display', 'block') : false; // eslint-disable-line no-unused-vars

        autoHighlight();
    }

    // Update the cart function
    function updateCart() {
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
            $sideCart.html(response.content);
            $sideCartDetails.html(response.details);
            $sideCartActions.html(response.actions);
            $('.cart-quantity').html(response.counter);

            // This line cuts out a five line else-if. It's not meant to be called after being created, just invoked upon birth.
            const sideCartPopulatedCheck = (!$('.side-cart-item').text()) ? $('.side-cart-placeholder').css('display', 'block') : false; // eslint-disable-line no-unused-vars

            $('body').trigger('cart-quantity-update', response.counter);

            $('.side-cart-loading').css('display', 'none');
            $('.side-cart-item').css('opacity', '1');
            itemInCart();
        });

        updateCartSize();
    }

    // Popup function for input notification
    function popup(target, parent, child, str, delay) {
        const $popup = $(target).parents(`${parent}`).find(`${child}`);

        $popup.html(`${str}`);
        $popup.fadeIn(0).delay(delay).fadeOut(0);
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

    // Setup a listener for window resizing/scrolling to help keep side-cart boundaries compliant
    const catchWindowResize = debounce(() => {
        updateCartSize();
    }, 350);

    $(window).resize(catchWindowResize);
    $(window).scroll(catchWindowResize);

    // Bind the quick add SKU button
    function processForm(event, form) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const targetForm = form;
        const sku = $(targetForm).find('[data-sku]');
        const qty = $(targetForm).find('[data-qty]');
        const url = `/cart.php?action=add&sku=${sku.val()}&qty=${qty.val()}`;

        const options = {
            template: {
                error: 'f/b2b/quick-add-response',
                content: 'f/b2b/side-cart-content',
                details: 'f/b2b/side-cart-details',
                newsku: 'f/b2b/side-cart-quick-add-sku',
                counter: 'f/cart/item-count',
            },
        };

        if (sku.val() && qty.val()) {
            request(url, {
                method: 'POST',
                requestOptions: options,
            }, (err, response) => {
                const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
                const cleanResponse = response.error.replace(scriptRegex, '').trim();

                if (err) {
                    throw new Error(err);
                }

                if (cleanResponse.length) {
                    popup(event.currentTarget, '.side-cart-sku-add', '.add-side-cart-sku-item', cleanResponse, 4000);
                } else {
                    updateCart();
                    $('body').trigger('cart-quantity-update', response.counter);
                    // To add lang string
                    popup(event.currentTarget, '.side-cart-sku-add', '.add-side-cart-sku-item', `${qty.val()} &times ${sku.val()} Added to Cart`, 2000);
                }

                sku.val('');
                qty.val(1);
            });
        } else {
            popup(event.currentTarget, '.side-cart-sku-add', '.add-side-cart-sku-item', $(event.currentTarget).data('error'), 2000);
        }

        updateCartSize();
    }

    $form.on('submit', (event) => {
        processForm(event, event.target);
    });

    // Update a product quantity
    $(document).on('change', '.side-cart-item-qty-input', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const itemId = $(event.currentTarget).data('id').substring(4);
        const newQty = parseInt($(event.currentTarget).val(), 10);

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            if (response.data.errors.length) {
                const currentErr = response.data.errors.join('/n');
                const errMax = currentErr.search(/maximum/i);
                const errMin = currentErr.search(/minimum/i);
                const errStock = currentErr.search(/enough/i);

                if (errMax !== -1) {
                    popup(event.currentTarget, '.side-cart-item-info', '.change-side-cart-qty', $(event.currentTarget).data('quantity-max-error'), 2000);
                } else if (errMin !== -1) {
                    popup(event.currentTarget, '.side-cart-item-info', '.change-side-cart-qty', $(event.currentTarget).data('quantity-min-error'), 2000);
                } else if (errStock !== -1) {
                    popup(event.currentTarget, '.side-cart-item-info', '.change-side-cart-qty', $(event.currentTarget).data('stock-error'), 2000);
                } else {
                    popup(event.currentTarget, '.side-cart-item-info', '.change-side-cart-qty', currentErr, 2000);
                }
                autoHighlight();
            } else {
                updateCart();
            }
        });
    });

    // Remove item from the cart function
    function cartRemoveItem(itemId, productId) {
        utils.api.cart.itemRemove(itemId, (err, response) => {
            if (response) { // Catch for if you try to remove the item before the cart has been updated with it server-side
                if (response.data.status === 'succeed') {
                    updateCart();
                } else {
                    updateCart();
                    alert(response.data.errors.join('\n'));
                }
                itemInCart(productId);
            }
        });
    }

    // Remove an item from the cart trigger
    $(document).on('click', '.cart-remove', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const itemId = $(event.currentTarget).data('cart-itemid');
        const productId = $(event.currentTarget).data('product-id');
        cartRemoveItem(itemId, productId);
    });

    // Update everything
    updateCart();
}
