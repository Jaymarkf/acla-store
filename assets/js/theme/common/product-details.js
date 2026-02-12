import utils from '@bigcommerce/stencil-utils';
import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.reveal';
import ImageGallery from '../product/image-gallery';
import modalFactory, { showAlertModal } from '../global/modal';
import _ from 'lodash';
import Wishlist from '../wishlist';
import swal from '../global/sweet-alert';
import bannerUtils from './utils/banner-utils';
import { getCartItemJF,updateOptions,updateProduct } from './custom-jay';

export default class ProductDetails {
    constructor($scope, context, productAttributesData = {}) {
        this.$overlay = $('[data-cart-item-add] .loadingOverlay');
        this.$scope = $scope;
        this.context = context;
        this.imageGallery = new ImageGallery($('[data-image-gallery]', this.$scope));
        this.imageGallery.init();
        this.listenQuantityChange();
        this.initRadioAttributes();
        Wishlist.load(this.context);
        this.getTabRequests();

        const $form = $('form[data-cart-item-add]', $scope);
        const $productOptionsElement = $('[data-product-option-change]', $form);
        const hasOptions = $productOptionsElement.html().trim().length;
        const hasDefaultOptions = $productOptionsElement.find('[data-default]').length;
        if ($form[0].checkValidity()) {
            this.updateProductDetailsData();
        } else {
            this.toggleWalletButtonsVisibility(false);
        }
        const $buyNowBtn = $('#buy-now-button-main');
        const $atcBtn = $('#form-action-addToCart');

        $productOptionsElement.on('change', event => {
            this.productOptionsChanged(event);
            this.setProductVariant();
        });

        $atcBtn.on('click', event => {
            if (! $form[0].checkValidity()) {
                $form[0].reportValidity();
                $('#form-action-addToCart').val('Add to Cart');
            } else {

                this.addProductToCart(event, $form[0]);
            }
        });

        $buyNowBtn.on('click', event => {
            if (! $form[0].checkValidity()) {
                $form[0].reportValidity();
            } else {
                this.buyNowButton(event);
            }
        });

        // Update product attributes. Also update the initial view in case items are oos
        // or have default variant properties that change the view
        if ((_.isEmpty(productAttributesData) || hasDefaultOptions) && hasOptions) {
            const $productId = $('[name="product_id"]', $form).val();

            utils.api.productAttributes.optionChange($productId, $form.serialize(), 'products/bulk-discount-rates', (err, response) => {
                const attributesData = response.data || {};
                const attributesContent = response.content || {};
                this.updateProductAttributes(attributesData);
                if (hasDefaultOptions) {
                    this.updateView(attributesData, attributesContent);
                } else {
                    this.updateDefaultAttributesForOOS(attributesData);
                }
            });
        } else {
            this.updateProductAttributes(productAttributesData);
            bannerUtils.dispatchProductBannerEvent(productAttributesData);
        }

        $productOptionsElement.show();

        this.previewModal = modalFactory('#previewModal')[0];
        this.quickviewModal = modalFactory('#modal')[0];
    }





    /**
     * https://stackoverflow.com/questions/49672992/ajax-request-fails-when-sending-formdata-including-empty-file-input-in-safari
     * Safari browser with jquery 3.3.1 has an issue uploading empty file parameters. This function removes any empty files from the form params
     * @param formData: FormData object
     * @returns FormData object
     */
    filterEmptyFilesFromForm(formData) {
        try {
            for (const [key, val] of formData) {
                if (val instanceof File && !val.name && !val.size) {
                    formData.delete(key);
                }
            }
        } catch (e) {
            console.error(e); // eslint-disable-line no-console
        }
        return formData;
    }

    setProductVariant() {
        const unsatisfiedRequiredFields = [];
        const options = [];

        $.each($('[data-product-attribute]'), (index, value) => {
            const optionLabel = value.children[0].innerText;
            const optionTitle = optionLabel.split(':')[0].trim();
            const required = optionLabel.toLowerCase().includes('required');
            const type = value.getAttribute('data-product-attribute');

            if ((type === 'input-file' || type === 'input-text' || type === 'input-number') && value.querySelector('input').value === '' && required) {
                unsatisfiedRequiredFields.push(value);
            }

            if (type === 'textarea' && value.querySelector('textarea').value === '' && required) {
                unsatisfiedRequiredFields.push(value);
            }

            if (type === 'date') {
                const isSatisfied = Array.from(value.querySelectorAll('select')).every((select) => select.selectedIndex !== 0);

                if (isSatisfied) {
                    const dateString = Array.from(value.querySelectorAll('select')).map((x) => x.value).join('-');
                    options.push(`${optionTitle}:${dateString}`);

                    return;
                }

                if (required) {
                    unsatisfiedRequiredFields.push(value);
                }
            }

            if (type === 'set-select') {
                const select = value.querySelector('select');
                const selectedIndex = select.selectedIndex;

                if (selectedIndex !== 0) {
                    options.push(`${optionTitle}:${select.options[selectedIndex].innerText}`);

                    return;
                }

                if (required) {
                    unsatisfiedRequiredFields.push(value);
                }
            }

            if (type === 'set-rectangle' || type === 'set-radio' || type === 'swatch' || type === 'input-checkbox' || type === 'product-list') {
                const checked = value.querySelector(':checked');
                if (checked) {
                    if (type === 'set-rectangle' || type === 'set-radio' || type === 'product-list') {
                        const label = checked.labels[0].innerText;
                        if (label) {
                            options.push(`${optionTitle}:${label}`);
                        }
                    }

                    if (type === 'swatch') {
                        const label = checked.labels[0].children[0];
                        if (label) {
                            options.push(`${optionTitle}:${label.title}`);
                        }
                    }

                    if (type === 'input-checkbox') {
                        options.push(`${optionTitle}:Yes`);
                    }

                    return;
                }

                if (type === 'input-checkbox') {
                    options.push(`${optionTitle}:No`);
                }

                if (required) {
                    unsatisfiedRequiredFields.push(value);
                }
            }
        });

        let productVariant = unsatisfiedRequiredFields.length === 0 ? options.sort().join(', ') : 'unsatisfied';
        const view = $('.productView');

        if (productVariant) {
            productVariant = productVariant === 'unsatisfied' ? '' : productVariant;
            if (view.attr('data-event-type')) {
                view.attr('data-product-variant', productVariant);
            } else {
                const productName = view.find('.productView-title')[0].innerText;
                // Hotfix to stop js breaking on products with quotation marks in their name
                const sanitisedName = productName.replace(/(['"])/g, "\\$1"); // eslint-disable-line quotes
                // Unsupported still, maybe later
                // let sanitisedName = CSS.escape(productName);
                const card = $(`[data-name='${sanitisedName}']`);
                card.attr('data-product-variant', productVariant);

                // Old code
                // const productName = view.find('.productView-title')[0].innerText;
                // const card = $(`[data-name="${productName}"]`);
                // card.attr('data-product-variant', productVariant);
            }
        }
    }

    /**
     * Since $productView can be dynamically inserted using render_with,
     * We have to retrieve the respective elements
     *
     * @param $scope
     */
    getViewModel($scope) {
        return {
            $priceWithTax: $('[data-product-price-with-tax]', $scope),
            $priceWithoutTax: $('[data-product-price-without-tax]', $scope),
            rrpWithTax: {
                $div: $('.rrp-price--withTax', $scope),
                $span: $('[data-product-rrp-with-tax]', $scope),
            },
            rrpWithoutTax: {
                $div: $('.rrp-price--withoutTax', $scope),
                $span: $('[data-product-rrp-price-without-tax]', $scope),
            },
            nonSaleWithTax: {
                $div: $('.non-sale-price--withTax', $scope),
                $span: $('[data-product-non-sale-price-with-tax]', $scope),
            },
            nonSaleWithoutTax: {
                $div: $('.non-sale-price--withoutTax', $scope),
                $span: $('[data-product-non-sale-price-without-tax]', $scope),
            },
            priceSaved: {
                $div: $('.price-section--saving', $scope),
                $span: $('[data-product-price-saved]', $scope),
            },
            priceNowLabel: {
                $span: $('.price-now-label', $scope),
            },
            priceLabel: {
                $span: $('.price-label', $scope),
            },
            $weight: $('.productView-table [data-product-weight]', $scope),
            $increments: $('.form-field--increments :input', $scope),
            $addToCart: $('#form-action-addToCart', $scope),
            $buyNow: $('#buy-now-button-main', $scope),
            $wishlistVariation: $('[data-wishlist-add] [name="variation_id"]', $scope),
            stock: {
                $container: $('.productView__stock', $scope),
                $input: $('[data-product-stock]', $scope),
            },
            sku: {
                $label: $('dt.sku-label', $scope),
                $value: $('[data-product-sku]', $scope),
            },
            upc: {
                $label: $('dt.upc-label', $scope),
                $value: $('[data-product-upc]', $scope),
            },
            quantity: {
                $text: $('.incrementTotal', $scope),
                $input: $('[name=qty\\[\\]]', $scope),
            },
            $bulkPricing: $('.productView-info-bulkPricing', $scope),
            $walletButtons: $('[data-add-to-cart-wallet-buttons]', $scope),
        };
    }

    /**
     * Checks if the current window is being run inside an iframe
     * @returns {boolean}
     */
    isRunningInIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    /**
     *
     * Handle product options changes
     *
     */
    productOptionsChanged(event) {
        const $changedOption = $(event.target);
        const $form = $changedOption.parents('form');
        const productId = $('[name="product_id"]', $form).val();

        // Do not trigger an ajax request if it's a file or if the browser doesn't support FormData
        if ($changedOption.attr('type') === 'file' || window.FormData === undefined) {
            return;
        }

        utils.api.productAttributes.optionChange(productId, $form.serialize(), 'products/bulk-discount-rates', (err, response) => {
            const productAttributesData = response.data || {};
            const productAttributesContent = response.content || {};
            this.updateProductAttributes(productAttributesData);
            this.updateView(productAttributesData, productAttributesContent);
            this.updateProductDetailsData();
            bannerUtils.dispatchProductBannerEvent(productAttributesData);
        });
    }

    showProductImage(image) {
        if (_.isPlainObject(image)) {
            const zoomImageUrl = utils.tools.imageSrcset.getSrcset(
                image.data,
                { '1x': this.context.themeSettings.zoom_size },
                /*
                    Should match zoom size used for data-zoom-image in
                    components/products/product-view.html
                    Note that this will only be used as a fallback image for browsers that do not support srcset
                    Also note that getSrcset returns a simple src string when exactly one size is provided
                */
            );

            const mainImageUrl = utils.tools.imageSrcset.getSrcset(
                image.data,
                { '1x': this.context.themeSettings.product_size },
                /*
                    Should match fallback image size used for the main product image in
                    components/products/product-view.html
                    Note that this will only be used as a fallback image for browsers that do not support srcset
                    Also note that getSrcset returns a simple src string when exactly one size is provided
                */
            );

            const mainImageSrcset = utils.tools.imageSrcset.getSrcset(image.data);

            this.imageGallery.setAlternateImage({
                mainImageUrl,
                zoomImageUrl,
                mainImageSrcset,
            });
        } else {
            this.imageGallery.restoreImage();
        }
    }

    /**
     *
     * Handle action when the shopper clicks on + / - for quantity
     *
     */
    listenQuantityChange() {
        this.$scope.on('click', '[data-quantity-change] button', event => {
            event.preventDefault();
            const $target = $(event.currentTarget);
            const viewModel = this.getViewModel(this.$scope);
            const $input = viewModel.quantity.$input;
            const quantityMin = parseInt($input.data('quantity-min'), 10);
            const quantityMax = parseInt($input.data('quantity-max'), 10);

            let qty = parseInt($input.val(), 10);

            // If action is incrementing
            if ($target.data('action') === 'inc') {
                // If quantity max option is set
                if (quantityMax > 0) {
                    // Check quantity does not exceed max
                    if ((qty + 1) <= quantityMax) {
                        qty++;
                    }
                } else {
                    qty++;
                }
            // } else if (qty > 0) {
            //     // If quantity min option is set
            //     if (quantityMin > 0) {
            //         // Check quantity does not fall below min
            //         if ((qty - 1) >= quantityMin) {
            //             qty--;
            //         }
            //     } else {
            //         qty--;
            //     }
            // }
            }else{
                qty = Math.max(qty - 1, 0); // never go below 0
            }

            // update hidden input
            viewModel.quantity.$input.val(qty);
            // update text
            viewModel.quantity.$text.text(qty);

            this.updateProductDetailsData();
        });

        this.$scope.on('keyup', '.form-input--incrementTotal', () => {
            this.updateProductDetailsData();
        });
    }

    buyNowButton(event) {
        event.preventDefault();
        const $atcAction = $('#atc-form-action');
        const $form = $('form[data-cart-item-add]');

        $atcAction.val('buy');

        $form.submit();
    }

    /**
     *
     * Add a product to cart
     *
     */
       addProductToCart(event, form) {
        const self = this;
        const $addToCartBtn = $('#form-action-addToCart', $(event.target));
        const originalBtnVal = $addToCartBtn.val();
        const waitMessage = $addToCartBtn.data('waitMessage');

        const qtyInput = $(event.target).closest('.form').find('.form-input--incrementTotal') || 1;
        const qtyMin = parseInt(qtyInput.data('quantity-min'), 10) || null;
        const qtyMax = parseInt(qtyInput.data('quantity-max'), 10) || null;
        const minErr = qtyInput.data('quantity-min-error') || null;
        const maxErr = qtyInput.data('quantity-max-error') || null;
        const newQty = parseInt(Number(qtyInput.val()), 10) || null;

        const $atcAction = $('#atc-form-action');
        $atcAction.val('add');

        // Do not do AJAX if browser doesn't support FormData
        if (window.FormData === undefined) {
            return;
        }

        // Prevent default
        event.preventDefault();

        $addToCartBtn
            .val(waitMessage)
            .prop('disabled', true);

        // Does not quality for min/max quantity
        if (newQty < qtyMin) {
            $addToCartBtn
                .val(originalBtnVal)
                .prop('disabled', false);

            swal({
                text: minErr,
                type: 'error',
            }).catch(swal.noop);
            $('#form-action-addToCart').val('Add to Cart');
        } else if (qtyMax > 0 && newQty > qtyMax) {
            $addToCartBtn
                .val(originalBtnVal)
                .prop('disabled', false);

            swal({
                text: maxErr,
                type: 'error',
            }).catch(swal.noop);
             $('#form-action-addToCart').val('Add to Cart');
        } else if (newQty < 0 || Number.isNaN(newQty)) {
            $addToCartBtn
                .val(originalBtnVal)
                .prop('disabled', false);

            const invalidEntry = qtyInput.val();
            qtyInput.val(qtyMin);

            swal({
                text: `${invalidEntry} is not a valid entry`,
                type: 'error',
            })
                .catch(swal.noop);
            $('#form-action-addToCart').val('Add to Cart');
        } else {
                const output = updateOptions();

                const itemName =   $('h1.productView-title').text();
                const input_qty = $('input[id="qty[]"]').val();
                const result =  window.live_cart ? window.live_cart.lineItems.physicalItems : this.context.cartItems;

                if (output.status === "add-to-cart") {
                    this.addProductNormally(form, $addToCartBtn, originalBtnVal);
                } else if (output.status === "popup-decline") {
                    this.showEcCartPopup(
                       itemName,
                        input_qty,
                        output.sku
                    );
                } else if (output.status === "popup-choose") {

                       document.querySelector('.ec-qty-popup__container').style.display = 'block';
                       const itemId = result.find((item)=> item.sku === output.sku );
                       const live_qty = itemId.quantity;
                       const cartVariantId = itemId.id;
                       const option_name = itemId.options ? itemId.options[0].value : output.title;
                       this.showUpdateCartPopup(
                        itemName,
                        live_qty,
                        input_qty, 
                        output.sku, 
                        option_name,
                        ()=>{ //on ADD
                            this.addProductNormally(form, $addToCartBtn, originalBtnVal);
                        },
                        ()=>{ //on Replace
                              updateProduct(utils, cartVariantId, input_qty, (updatedCartId) => {
                                this.updateCartContent(this.previewModal, updatedCartId);
                                
                            });
                        },
                        ()=>{ //onclose
                            document.querySelector('.ec-qty-popup__container').style.display = 'none';
                        });

                }

            //   
        }
    }
    


/**
 * Add product to cart normally
 * @param {HTMLFormElement} form - The product form
 * @param {jQuery} $addToCartBtn - Add-to-cart button
 * @param {string} originalBtnVal - Original text of the button
 */
addProductNormally(form, $addToCartBtn, originalBtnVal) {

    this.$overlay.show();
    //else of checker
    utils.api.cart.itemAdd(this.filterEmptyFilesFromForm(new FormData(form)), (err, response) => {
        const errorMessage = err || response.data.error;
        this.$overlay.hide();

        $addToCartBtn
            .val(originalBtnVal)
            .prop('disabled', false);

        // Guard: show error if exists
        if (errorMessage) {
            const tmp = document.createElement('DIV');
            tmp.innerHTML = errorMessage;
            $('#form-action-addToCart').val('Add to Cart');
            return showAlertModal(tmp.textContent || tmp.innerText);
        }

        // Close quickview modal if open
        if (this.quickviewModal) {
            $('#form-action-addToCart').val('Add to Cart');
            this.quickviewModal.close();
        }

        // Preview modal logic
        if (this.previewModal) {


          
            if (this.context.addToCartMode === 'popup') {
                // this.previewModal.open();
            }

            //custom call js
            getCartItemJF(utils,response);


            this.updateCartContent(this.previewModal, response.data.cart_item.id);
            $('#form-action-addToCart').val('Added to cart!');
            setTimeout(() => {
                $('#form-action-addToCart').val('Add to Cart');
            }, 1000);
            


        } else {
            // If no modal, show overlay and redirect to cart page
            this.$overlay.show();
            this.redirectTo(response.data.cart_item.cart_url || this.context.urls.cart);
        }
     
    });

}


    /**
     * Show the update cart popup when the user tries to add a product that's already in the cart
     * @param {string} itemName - Name of the product
     * @param {number} quantity - Quantity already in cart
     */
    showUpdateCartPopup(itemName, quantity,livequantity, sku,optionName, onAdd, onReplace, onClose) {
    const $popup = $('.ec-qty-popup__container');

    const message = `
        You currently have qty: <strong>${quantity}</strong> in your cart for item: <strong>${itemName} (${sku} : ${optionName} )</strong><br><br>
        Choose to <strong>ADD Qty:</strong> ${livequantity}<br><br>
        or <strong>REPLACE WITH Qty:</strong> ${livequantity}
    `;

    $popup.find('.ec-qty-popup__message').html(message);
    $popup.fadeIn(200);

    // Button handlers
    $popup.find('.ec-qty-popup__btn--add').off('click').on('click', () => {
        if (typeof onAdd === 'function') onAdd();
        $popup.fadeOut(200);
    });

    $popup.find('.ec-qty-popup__btn--replace').off('click').on('click', () => {
        if (typeof onReplace === 'function') onReplace();
        $popup.fadeOut(200);
    });

    $popup.find('.ec-qty-popup__btn--close').off('click').on('click', () => {
        if (typeof onClose === 'function') onClose();
        $popup.fadeOut(200);
    });
    }
    




    /**
     * Show the ecommerce cart popup
     * @param {string} itemName - Name of the product
     * @param {number} quantity - Quantity already in cart
    */
    showEcCartPopup(itemName, quantity, sku) {
        const $popup = $('.ec-cart-popup__container');
         $('#form-action-addToCart').val('Add to Cart');
        // Set content dynamically
        $popup.find('.ec-cart-popup__title').text('Item already in cart');
        $popup.find('.ec-cart-popup__message').html(
            `You already have <strong>${quantity}</strong> of <strong>${itemName}</strong> SKU: <strong> ${sku}</strong> in your cart.<br>
            Update the quantity if you’d like to make a change.`
        );

        // Stop any previous animation and show popup
        $popup.stop(true, true).fadeIn(200);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            $popup.fadeOut(300);
        }, 8000);

        // Close button
        $popup.find('.ec-cart-popup__close').off('click').on('click', function() {
            $popup.fadeOut(200);
        });
    }









    /**
     * Get cart contents
     *
     * @param {String} cartItemId
     * @param {Function} onComplete
     */
    getCartContent(cartItemId, onComplete) {
        const options = {
            template: 'cart/preview',
            params: {
                suggest: cartItemId,
            },
            config: {
                cart: {
                    suggestions: {
                        limit: 4,
                    },
                },
            },
        };

        utils.api.cart.getContent(options, onComplete);

    }

    /**
     * Redirect to url
     *
     * @param {String} url
     */
    redirectTo(url) {
        if (this.isRunningInIframe() && !window.iframeSdk) {
            window.top.location = url;
        } else {
            window.location = url;
        }
    }

    /**
     * Update cart content
     *
     * @param {Modal} modal
     * @param {String} cartItemId
     * @param {Function} onComplete
     */
    updateCartContent(modal, cartItemId, onComplete) {
        const $sideCart = $('.side-cart-content');

        if ($sideCart) {
            const $sideCartDetails = $('.side-cart-details');
            const $sideCartActions = $('.side-cart-actions');

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

                $('body').trigger('cart-quantity-update', response.counter);
                
            });
        }

        this.getCartContent(cartItemId, (err, response) => {
            if (err) {
                return;
            }

            modal.updateContent(response);
            if (this.context.addToCartMode === 'dropdown') {
                this.showCartPreview();
            }

            // Update cart counter
            const $body = $('body');
            const $cartQuantity = $('[data-cart-quantity]', modal.$content);
            const $cartCounter = $('.navUser-action .cart-count');
            const quantity = $cartQuantity.data('cartQuantity') || 0;
        
            $cartCounter.addClass('cart-count--positive');
            $body.trigger('cart-quantity-update', quantity);

            if (onComplete) {
                onComplete(response);
            }
        });
    }

    showCartPreview() {
        const loadingClass = 'is-loading';
        const $cartDropdown = $('#cart-preview-dropdown');
        const $cartLoading = $('<div class="loadingOverlay"></div>');
        const options = {
            template: 'common/cart-preview',
        };

        function hideCartPreview() {
            $cartDropdown
                .removeClass('cartPreview-isOpen is-open')
                .removeAttr('style')
                .css({
                    left: '-99999px',
                });
        }

        // Redirect to full cart page
        //
        // https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
        // In summary, we recommend looking for the string 'Mobi' anywhere in the User Agent to detect a mobile device.
        if (/Mobi/i.test(navigator.userAgent)) {
            return event.stopPropagation(); // eslint-disable-line
        }

        // event.preventDefault();

        $cartDropdown
            .addClass(loadingClass)
            .html($cartLoading);
        $cartLoading
            .show();

        utils.api.cart.getContent(options, (err, response) => {
            $cartDropdown
                .removeClass(loadingClass)
                .html(response);
            $cartLoading
                .hide();
            $cartDropdown
                .addClass('cartPreview-isOpen is-open')
                .css({
                    left: 'inherit',
                    right: '20px',
                    top: '49px',
                })
                .slideDown('fast');
            setTimeout(hideCartPreview, 3000);
        });
    }

    /**
     * Show an message box if a message is passed
     * Hide the box if the message is empty
     * @param  {String} message
     */
    showMessageBox(message) {
        const $messageBox = $('.productAttributes-message');

        if (message) {
            $('.alertBox-message', $messageBox).text(message);
            $messageBox.show();
        } else {
            $messageBox.hide();
        }
    }

    /**
     * Hide the pricing elements that will show up only when the price exists in API
     * @param viewModel
     */
    clearPricingNotFound(viewModel) {
        viewModel.rrpWithTax.$div.hide();
        viewModel.rrpWithoutTax.$div.hide();
        viewModel.nonSaleWithTax.$div.hide();
        viewModel.nonSaleWithoutTax.$div.hide();
        viewModel.priceSaved.$div.hide();
        viewModel.priceNowLabel.$span.hide();
        viewModel.priceLabel.$span.hide();
    }

    /**
     * Update the view of price, messages, SKU and stock options when a product option changes
     * @param  {Object} data Product attribute data
     */
    updatePriceView(viewModel, price) {
        this.clearPricingNotFound(viewModel);

        if (price.with_tax) {
            viewModel.priceLabel.$span.show();
            viewModel.$priceWithTax.html(price.with_tax.formatted);
        }

        if (price.without_tax) {
            viewModel.priceLabel.$span.show();
            viewModel.$priceWithoutTax.html(price.without_tax.formatted);
        }

        if (price.rrp_with_tax) {
            viewModel.rrpWithTax.$div.show();
            viewModel.rrpWithTax.$span.html(price.rrp_with_tax.formatted);
        }

        if (price.rrp_without_tax) {
            viewModel.rrpWithoutTax.$div.show();
            viewModel.rrpWithoutTax.$span.html(price.rrp_without_tax.formatted);
        }

        if (price.saved) {
            viewModel.priceSaved.$div.show();
            viewModel.priceSaved.$span.html(price.saved.formatted);
        }

        if (price.non_sale_price_with_tax) {
            viewModel.priceLabel.$span.hide();
            viewModel.nonSaleWithTax.$div.show();
            viewModel.priceNowLabel.$span.show();
            viewModel.nonSaleWithTax.$span.html(price.non_sale_price_with_tax.formatted);
        }

        if (price.non_sale_price_without_tax) {
            viewModel.priceLabel.$span.hide();
            viewModel.nonSaleWithoutTax.$div.show();
            viewModel.priceNowLabel.$span.show();
            viewModel.nonSaleWithoutTax.$span.html(price.non_sale_price_without_tax.formatted);
        }
    }

    /**
     * Update the view of price, messages, SKU and stock options when a product option changes
     * @param  {Object} data Product attribute data
     */
    updateView(data, content = null) {
        const viewModel = this.getViewModel(this.$scope);

        this.showMessageBox(data.stock_message || data.purchasing_message);

        if (_.isObject(data.price)) {
            this.updatePriceView(viewModel, data.price);
        }

        if (_.isObject(data.weight)) {
            viewModel.$weight.html(data.weight.formatted);
        }

        // Set variation_id if it exists for adding to wishlist
        if (data.variantId) {
            viewModel.$wishlistVariation.val(data.variantId);
        }

        // If SKU is available
        if (data.sku) {
            viewModel.sku.$value.text(data.sku);
            viewModel.sku.$label.show();
        } else {
            viewModel.sku.$label.hide();
            viewModel.sku.$value.text('');
        }

        // If UPC is available
        if (data.upc) {
            viewModel.upc.$value.text(data.upc);
            viewModel.upc.$label.show();
        } else {
            viewModel.upc.$label.hide();
            viewModel.upc.$value.text('');
        }

        // if stock view is on (CP settings)
        if (viewModel.stock.$container.length && _.isNumber(data.stock)) {
            // if the stock container is hidden, show
            viewModel.stock.$container.removeClass('u-hiddenVisually');

            viewModel.stock.$input.text(data.stock);
        } else {
            viewModel.stock.$container.addClass('u-hiddenVisually');
            viewModel.stock.$input.text(data.stock);
        }

        this.updateDefaultAttributesForOOS(data);
        this.updateWalletButtonsView(data);

        // If Bulk Pricing rendered HTML is available
        if (data.bulk_discount_rates && content) {
            viewModel.$bulkPricing.html(content);
        } else if (typeof (data.bulk_discount_rates) !== 'undefined') {
            viewModel.$bulkPricing.html('');
        }

        const addToCartWrapper = $('#add-to-cart-wrapper');

        if (addToCartWrapper.is(':hidden') && data.purchasable) {
            addToCartWrapper.show();
        }
    }

    updateDefaultAttributesForOOS(data) {
        const viewModel = this.getViewModel(this.$scope);
        if (!data.purchasable || !data.instock) {
            viewModel.$addToCart.prop('disabled', true);
            viewModel.$buyNow.prop('disabled', true);
            viewModel.$increments.prop('disabled', true);
            viewModel.stock.$container.removeClass('form-label--stock').addClass('form-label--out-of-stock');
        } else {
            viewModel.$addToCart.prop('disabled', false);
            viewModel.$buyNow.prop('disabled', false);
            viewModel.$increments.prop('disabled', false);
            viewModel.stock.$container.removeClass('form-label--out-of-stock').addClass('form-label--stock');
        }
    }

    updateWalletButtonsView(data) {
        this.toggleWalletButtonsVisibility(data.purchasable && data.instock);
    }

    toggleWalletButtonsVisibility(shouldShow) {
        const viewModel = this.getViewModel(this.$scope);

        if (shouldShow) {
            viewModel.$walletButtons.show();
        } else {
            viewModel.$walletButtons.hide();
        }
    }

    /**
     * Hide or mark as unavailable out of stock attributes if enabled
     * @param  {Object} data Product attribute data
     */
    updateProductAttributes(data) {
        const behavior = data.out_of_stock_behavior;
        const inStockIds = data.in_stock_attributes;
        const outOfStockMessage = ` (${data.out_of_stock_message})`;

        this.showProductImage(data.image);

        if (behavior !== 'hide_option' && behavior !== 'label_option') {
            return;
        }

        $('[data-product-attribute-value]', this.$scope).each((i, attribute) => {
            const $attribute = $(attribute);
            const attrId = parseInt($attribute.data('productAttributeValue'), 10);


            if (inStockIds.indexOf(attrId) !== -1) {
                this.enableAttribute($attribute, behavior, outOfStockMessage);
            } else {
                this.disableAttribute($attribute, behavior, outOfStockMessage);
            }
        });
    }

    updateProductDetailsData() {
        const $form = $('form[data-cart-item-add]');
        const formDataItems = $form.serializeArray();

        const productDetails = {};

        for (const formDataItem of formDataItems) {
            const { name, value } = formDataItem;

            if (name === 'product_id') {
                productDetails.productId = Number(value);
            }

            if (name === 'qty[]') {
                productDetails.quantity = Number(value);
            }

            if (name.match(/attribute/)) {
                const productOption = {
                    optionId: Number(name.match(/\d+/g)[0]),
                    optionValue: value,
                };

                productDetails.optionSelections = productDetails?.optionSelections
                    ? [...productDetails.optionSelections, productOption]
                    : [productOption];
            }
        }

        document.dispatchEvent(new CustomEvent('onProductUpdate', {
            bubbles: true,
            detail: { productDetails },
        }));
    }

    disableAttribute($attribute, behavior, outOfStockMessage) {
        if (this.getAttributeType($attribute) === 'set-select') {
            return this.disableSelectOptionAttribute($attribute, behavior, outOfStockMessage);
        }

        if (behavior === 'hide_option') {
            $attribute.hide();
        } else {
            $attribute.addClass('unavailable');
        }
    }

    disableSelectOptionAttribute($attribute, behavior, outOfStockMessage) {
        const $select = $attribute.parent();

        if (behavior === 'hide_option') {
            $attribute.toggleOption(false);
            // If the attribute is the selected option in a select dropdown, select the first option (MERC-639)
            if ($select.val() === $attribute.attr('value')) {
                $select[0].selectedIndex = 0;
            }
        } else {
            $attribute.attr('disabled', 'disabled');
            $attribute.html($attribute.html().replace(outOfStockMessage, '') + outOfStockMessage);
        }
    }

    enableAttribute($attribute, behavior, outOfStockMessage) {
        if (this.getAttributeType($attribute) === 'set-select') {
            return this.enableSelectOptionAttribute($attribute, behavior, outOfStockMessage);
        }

        if (behavior === 'hide_option') {
            $attribute.show();
        } else {
            $attribute.removeClass('unavailable');
        }
    }

    enableSelectOptionAttribute($attribute, behavior, outOfStockMessage) {
        if (behavior === 'hide_option') {
            $attribute.toggleOption(true);
        } else {
            $attribute.prop('disabled', false);
            $attribute.html($attribute.html().replace(outOfStockMessage, ''));
        }
    }

    getAttributeType($attribute) {
        const $parent = $attribute.closest('[data-product-attribute]');

        return $parent ? $parent.data('productAttribute') : null;
    }

    /**
     * Allow radio buttons to get deselected
     */
    initRadioAttributes() {
        $('[data-product-attribute] input[type="radio"]', this.$scope).each((i, radio) => {
            const $radio = $(radio);

            // Only bind to click once
            if ($radio.attr('data-state') !== undefined) {
                $radio.on('click', () => {
                    if ($radio.data('state') === true) {
                        $radio.prop('checked', false);
                        $radio.data('state', false);

                        $radio.trigger('change');
                    } else {
                        $radio.data('state', true);
                    }

                    this.initRadioAttributes();
                });
            }

            $radio.attr('data-state', $radio.prop('checked'));
        });
    }

    /**
     * Check for fragment identifier in URL requesting a specific tab
     */
    getTabRequests() {
        if (window.location.hash && window.location.hash.indexOf('#tab-') === 0) {
            const $activeTab = $('.tabs').has(`[href='${window.location.hash}']`);
            const $tabContent = $(`${window.location.hash}`);

            if ($activeTab.length > 0) {
                $activeTab.find('.tab')
                    .removeClass('is-active')
                    .has(`[href='${window.location.hash}']`)
                    .addClass('is-active');

                $tabContent.addClass('is-active')
                    .siblings()
                    .removeClass('is-active');
            }
        }
    }
}
