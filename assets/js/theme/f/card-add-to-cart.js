import utils from '@bigcommerce/stencil-utils';
import itemInCart from './card-item-in-cart';

export default function ({ itemAdded }) {
    function updateSideCart() {
        const $sideCart = $('.side-cart-content');
        const $sideCartDetails = $('.side-cart-details');
        const $sideCartActions = $('.side-cart-actions');

        const options = {
            template: {
                template: 'f/b2b/side-cart-content',
                details: 'f/b2b/side-cart-details',
                actions: 'f/b2b/side-cart-actions',
                itemcount: 'f/cart/item-count',
            },
        };

        utils.api.cart.getContent(options, (err, response) => {
            if (response.itemcount > 0) {
                $sideCart.html(response.template);
                $sideCartDetails.html(response.details);
                $sideCartActions.html(response.actions);
                $('.cart-quantity').html(response.itemcount);
                itemInCart();
            }

            $('.side-cart-loading').css('display', 'none');
            $('.side-cart-item').css('opacity', '1');
        });
    }

    // Popup function for input notification
    function popup(target, str, delay) {
        const $addPopup = $(target).find('.add-card-popup');

        $addPopup.html(`${str}`);
        $addPopup.fadeIn(0).delay(delay).fadeOut(0);
        $('target').blur();
    }

    function addProductToCart(event, form) {
        $('.side-cart-loading').css('display', 'block');
        $('.side-cart-item').css('opacity', '0.5');

        // Get target product
        const $addToCartBtn = $('.button.button--primary.button--cardAdd', $(event.target));
        const originalBtnVal = $addToCartBtn.val();
        const waitMessage = $addToCartBtn.data('waitMessage');

        // Do not do AJAX if browser doesn't support FormData
        if (window.FormData === undefined) {
            $('.side-cart-loading').css('display', 'none');
            $('.side-cart-item').css('opacity', '1');
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        $addToCartBtn
            .val(waitMessage)
            .prop('disabled', true);

        // Add item to cart
        utils.api.cart.itemAdd(new FormData(form), (err, response) => {
            const errorMessage = err || response.data.error;

            $addToCartBtn
                .val(originalBtnVal)
                .prop('disabled', false);

            // Guard statement
            if (errorMessage) {
                popup(event.target, errorMessage, 4000);
            } else {
                // To add lang string
                popup(event.target, itemAdded, 2000);
            }

            const cartOptions = {
                template: 'f/cart/item-count',
            };

            utils.api.cart.getContent(cartOptions, (error, resp) => {
                $('.cart-quantity').html(resp);
                if (utils.tools.storage.localStorageAvailable()) {
                    localStorage.setItem('cart-quantity', resp);
                }
            });

            updateSideCart();
        });
    }

    $('[data-cart-item-add-from-card]').on('submit', (event) => {
        addProductToCart(event, event.target);
    });
}
