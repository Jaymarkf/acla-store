export default function (removeItemId) {
    // Display on product card that product has been added to cart
    const cartItems = $('#cart-preview-dropdown .side-cart-item');
    for (const cartItem of cartItems) {
        const itemId = $(cartItem).find('[data-product-id]').data().productId;
        const itemQty = cartItem.querySelector('[value]').value;
        const itemTextContainer = $('.card').find(`[data-qtyInCart='${itemId}']`);
        // To add lang string
        itemTextContainer.html(`You have ${itemQty} in your cart`);
    }

    if (removeItemId) {
        $('.card').find(`[data-qtyInCart='${removeItemId}']`).html('');
    }
}
