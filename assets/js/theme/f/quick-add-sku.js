import request from './request';

export default function ({ addSuccess }) {
    const $form = $('.js-quick-add');

    function popup(str, delay) {
        const $skuAddPopup = $('.add-sku-item');

        $skuAddPopup.html(`${str}`);
        $skuAddPopup.fadeIn(0).delay(delay).fadeOut(0);
    }

    function processForm(event, form) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const targetForm = form;
        const sku = $(targetForm).find('[data-sku]');
        const qty = $(targetForm).find('[data-qty]');
        const url = `/cart.php?action=add&sku=${sku.val()}&qty=${qty.val()}`;

        const $sideCart = $('.side-cart-content');
        const $sideCartDetails = $('.side-cart-details');
        const $sideCartActions = $('.side-cart-actions');

        const options = {
            template: {
                error: 'f/b2b/quick-add-response',
                content: 'f/b2b/side-cart-content',
                details: 'f/b2b/side-cart-details',
                actions: 'f/b2b/side-cart-actions',
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
                    popup(cleanResponse, 4000);
                } else {
                    $sideCart.html(response.content);
                    $sideCartDetails.html(response.details);
                    $sideCartActions.html(response.actions);
                    $('body').trigger('cart-quantity-update', response.counter);
                    popup(`${qty.val()} &times ${sku.val()} ${addSuccess}`, 2000);
                }

                sku.val('');
                qty.val(1);
            });
        } else {
            popup($(event.currentTarget).data('error'), 2000);
        }
    }


    $form.on('submit', (event) => {
        processForm(event, event.target);
    });
}
