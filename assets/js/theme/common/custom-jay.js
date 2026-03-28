
export function getCartItemJF(utils,current){
      utils.api.cart.getCart({}, (err, response) => {
            // storeGlobally
            window.live_cart = response;
            const newCartItem = current.data.cart_item.id;
            const item = response.lineItems.physicalItems.find(
                              item => item.id === newCartItem
            );
            updateOptionJF(item);  
            
      });
}

export function getCartUpdate(utils){
       utils.api.cart.getCart({}, (err, response) => {
            window.live_cart = response;  
      }); 
}
export function updateOptionJF(cartItem) {
    if (!cartItem) return;

    const sku = cartItem.sku;
    const quantity = cartItem.quantity;

    const input_quantity = $('input[id="qty[]"]');

    // Find ANY checked input inside product options
    const $checkedInput = $('[data-product-option-change] input:checked');

    if ($checkedInput.length) {
        const value = $checkedInput.val();

        const $label = $('[data-product-attribute-value="' + value + '"]');

        $label.attr('custom-attribute-sku', sku);
        $label.attr('custom-attribute-cart-quantity', quantity);

        input_quantity.val(quantity);
    }
}


export function updateOptions() {
    var selectedRadio = $('[data-product-option-change] input[type="radio"]:checked').val();

    var $matchedEl = $('[data-product-attribute-value="' + selectedRadio + '"]');

    var quantity = $matchedEl.attr('custom-attribute-cart-quantity');
    var sku = $matchedEl.attr('custom-attribute-sku');
    var title = $matchedEl.text().trim();

    var input = $('input[id="qty[]"]').val();

    if (!quantity) { 
        // new item not in cart
        return {
            status: "add-to-cart",
            sku: sku
        };
    } else {
        if (input === quantity) {
            return {
                status: "popup-decline",
                sku: sku
            };
        } else {
            return {
                status: "popup-choose",
                sku: sku,
                title:title
            };
        }
    }
}


export function updateProduct(utils, cartId, newQty, callback) {
    utils.api.cart.itemUpdate(cartId, newQty, (err, response) => {
        if (err) {
            console.error("custom-error", err);
            return;
        }

        if (response.data.status === 'succeed') {
            $('#form-action-addToCart').val('Added to Cart!');
            setTimeout(function(){
                $('#form-action-addToCart').val('Add to Cart');
            },2000);
            getCartUpdate(utils);

            const $checkedInput = $('[data-product-option-change] input:checked');

            if ($checkedInput.length) {
                const value = $checkedInput.val();
                const $label = $('[data-product-attribute-value="' + value + '"]');
                $label.attr('custom-attribute-cart-quantity', newQty);
            }

            if (typeof callback === "function") {
                callback(cartId);
            }
        }
    });
}
