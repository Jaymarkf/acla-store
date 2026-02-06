import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import PageManager from './page-manager';
import checkIsGiftCertValid from './common/gift-certificate-validator';
import { createTranslationDictionary } from './common/utils/translations-utils';
import ShippingEstimator from './cart/shipping-estimator';
import { defaultModal } from './global/modal';
import swal from './global/sweet-alert';
import apiCall from './f/api';
import countdown from './f/countdown';

export default class Cart extends PageManager {
    onReady() {
        this.$cartContent = $('[data-cart-content]');
        this.$cartMessages = $('[data-cart-status]');
        this.$cartTotals = $('[data-cart-totals]');
        this.$overlay = $('[data-cart] .loadingOverlay')
            .hide(); // TODO: temporary until roper pulls in his cart components

        // Classes
        this.classRow = '.cart-item-title';
        this.classResultMessage = '.list-feedback';

        // Class names
        this.classNameRowError = 'list-add__row--error';

        // Functional assignments
        this.$form = $('.cart-list-form');
        this.$newList = $('.add-new-list');
        this.$addingOverlay = $('.loading-overlay');
        this.$document = $(document);

        this.resetState();

        this.bindEvents();

        if (this.context.showCartCountdown) {
            countdown(this.context.cartCountdownTimer, 'cart-countdown', this.context.cartCountdownEndMessage);
        }
    }

    resetState() {
        this.items = [];
        this.errors = [];
        this.currentLoop = 0;
    }

    // Run AJAX calls one by one
    handleAjax() {
        if (this.currentLoop < this.items.length) {
            $(this.classResultMessage).html(`Saving<br> ${this.items[this.currentLoop].pname}<br> to your list`);
            utils.api.getPage(this.items[this.currentLoop].url, {
                template: 'f/b2b/add-to-list-response',
            }, (err) => {
                if (err) {
                    throw new Error(err);
                }

                // Increment 'current' and run AJAX call again
                this.currentLoop++;
                this.handleAjax();
            });
        }

        // Last attempt, redirect only
        if (this.currentLoop === this.items.length) {
            this.$addingOverlay.hide();

            if (this.listTarget !== '' && this.listTarget !== undefined) {
                document.location.href = `/wishlist.php?action=viewwishlistitems${this.listTarget}`;
            } else {
                document.location.href = '/wishlist.php';
            }
            // $('.multi_add__cart-button').css('display', 'inline-block');
            // $('.multi-add__row[data-status=success]').remove();
        }
    }

    processForm(event, form) {
        event.preventDefault();

        this.$addingOverlay.show();

        const allRows = $(form).find(this.classRow);
        const allMessages = allRows.find(this.classResultMessage);

        this.resetState();

        // For each row, add the URL and target to the items array
        allRows.each((index, row) => {
            const target = $(row);
            const pid = target.find('[data-pid]').val();
            const pname = target.find('.cart-item-name').attr('data-pname');
            this.listTarget = $('#list-id').val();

            if (this.listTarget !== '' && this.listTarget !== undefined) {
                this.listTarget = `&wishlistid=${this.listTarget}`;
            } else {
                this.listTarget = '';
            }

            const url = `/wishlist.php?action=add&product_id=${pid}${this.listTarget}`;
            this.items.push({
                url,
                target,
                pname,
            });
        });

        // To add lang string
        allMessages.text('Saving to list...').show();
        this.handleAjax();
    }

    openAddList(event) {
        event.preventDefault();

        const modal = defaultModal();

        utils.api.getPage('/cart.php', {
            template: 'f/cart/add-list-form',
        }, (err, response) => {
            if (err) {
                throw new Error(err);
            }

            if (response.length) {
                modal.updateContent(response);
                $('#wishlistname').select();
            }
        });

        modal.open();
    }

    addNewList(event) {
        event.preventDefault();

        const modal = defaultModal();
        const listName = $('#wishlistname').val();
        const sharedList = $('#publicwishlist').val();
        const targetUrl = '/wishlist.php?action=addwishlist&product_id=';

        $.ajax({
            method: 'POST',
            url: targetUrl,
            data: {
                wishlistname: listName,
                publicwishlist: sharedList,
                submit: null,
            },
        }).done(() => {
            utils.api.getPage('/wishlist.php', {
                template: 'f/b2b/list-added-response',
            }, (err, response) => {
                if (err) {
                    throw new Error(err);
                }

                if (response.length) {
                    // replace contents of '.list-selector' with response
                    $('.list-selector').html(response);
                }

                modal.close();
            });
        });
    }

    cartUpdate($target) {
        const itemId = $target.data('cartItemid');
        const $el = $(`#qty-${itemId}`);
        const oldQty = parseInt($el.val(), 10);
        const maxQty = parseInt($el.data('quantity-max'), 10);
        const minQty = parseInt($el.data('quantity-min'), 10);
        const minError = $el.data('quantity-min-error');
        const maxError = $el.data('quantity-max-error');
        const newQty = $target.data('action') === 'inc' ? oldQty + 1 : oldQty - 1;
        // Does not qualify for min/max quantity
        if (newQty < minQty) {
            return swal({
                text: minError,
                type: 'error',
            });
        } else if (maxQty > 0 && newQty > maxQty) {
            return swal({
                text: maxError,
                type: 'error',
            });
        }

        this.$overlay.show();

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            this.$overlay.hide();

            if (response.data.status === 'succeed') {
                // if the quantity is changed "1" from "0", we have to remove the row.
                const remove = (newQty === 0);

                this.refreshContent(remove);
            } else {
                $el.val(oldQty);
                swal({
                    text: response.data.errors.join('\n'),
                    type: 'error',
                });
            }
        });
    }

    cartUpdateQtyTextChange($target, preVal = null) {
        const itemId = $target.data('cart-itemid');
        const $el = $(`#qty-${itemId}`);
        const minQty = parseInt($el.data('quantity-min'), 10);
        const oldQty = preVal !== null ? preVal : minQty;
        const newQty = parseInt(Number($el.val()), 10);

        let invalidEntry;
        // Does not quality for min/max quantity
        if (newQty < 0 || Number.isNaN(newQty)) {
            invalidEntry = $el.val();
            $el.val(oldQty);
            swal({
                text: this.context.invalidEntryMessage.replace('[ENTRY]', invalidEntry),
                type: 'error',
            });
        } else {
            this.$overlay.show();

            utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
                this.$overlay.hide();

                if (response.data.status === 'succeed') {
                    // if the quantity is changed "1" from "0", we have to remove the row.
                    const remove = (newQty === 0);
                    this.refreshContent(remove);
                } else {
                    $el.val(oldQty);
                    swal({
                        text: response.data.errors.join('\n'),
                        type: 'error',
                    });
                }
            });
        }
    }

    cartRemoveItem(itemId) {
        this.$overlay.show();
        utils.api.cart.itemRemove(itemId, (err, response) => {
            if (response.data.status === 'succeed') {
                this.refreshContent(true);
            } else {
                swal({
                    text: response.data.errors.join('\n'),
                    type: 'error',
                }).then(() => {
                    this.refreshContent(true);
                });
            }
        });
    }

    cartEditOptions(itemId) {
        const modal = defaultModal();
        const options = {
            template: 'cart/modals/configure-product',
        };

        modal.open();

        utils.api.productAttributes.configureInCart(itemId, options, (err, response) => {
            modal.updateContent(response.content);

            this.bindGiftWrappingForm();
        });

        utils.hooks.on('product-option-change', (event, currentTarget) => {
            const $changedOption = $(currentTarget);
            const $form = $changedOption.parents('form');
            const $submit = $('input.button', $form);
            const $messageBox = $('.alertMessageBox');
            const item = $('[name="item_id"]', $form).attr('value');

            utils.api.productAttributes.optionChange(item, $form.serialize(), (err, result) => {
                const data = result.data || {};

                if (err) {
                    swal({
                        text: err,
                        type: 'error',
                    });
                    return false;
                }

                if (data.purchasing_message) {
                    $('p.alertBox-message', $messageBox).text(data.purchasing_message);
                    $submit.prop('disabled', true);
                    $messageBox.show();
                } else {
                    $submit.prop('disabled', false);
                    $messageBox.hide();
                }

                if (!data.purchasable || !data.instock) {
                    $submit.prop('disabled', true);
                } else {
                    $submit.prop('disabled', false);
                }
            });
        });
    }

    refreshContent(remove, empty) {
        const $cartItemsRows = $('[data-item-row]', this.$cartContent);
        const $cartPageTitle = $('[data-cart-page-title]');
        const options = {
            template: {
                content: 'cart/content',
                totals: 'cart/totals',
                pageTitle: 'cart/page-title',
                statusMessages: 'cart/status-messages',
            },
        };

        this.$overlay.show();

        // Remove last item from cart? Reload
        if (remove && $cartItemsRows.length === 1) {
            return window.location.reload();
        }

        // Remove last item from cart? Reload
        if (remove && empty) {
            return window.location.reload();
        }

        utils.api.cart.getContent(options, (err, response) => {
            this.$cartContent.html(response.content);
            this.$cartTotals.html(response.totals);
            this.$cartMessages.html(response.statusMessages);

            $cartPageTitle.replaceWith(response.pageTitle);
            this.bindEvents();
            this.$overlay.hide();

            const quantity = $('[data-cart-quantity]', this.$cartContent).data('cart-quantity') || 0;
            $('body').trigger('cart-quantity-update', quantity);
        });
    }

    bindCartEvents() {
        const debounceTimeout = 400;
        const cartUpdate = _.bind(_.debounce(this.cartUpdate, debounceTimeout), this);
        const cartUpdateQtyTextChange = _.bind(_.debounce(this.cartUpdateQtyTextChange, debounceTimeout), this);
        const cartRemoveItem = _.bind(_.debounce(this.cartRemoveItem, debounceTimeout), this);
        let preVal;

        // cart update
        $('[data-cart-update]', this.$cartContent).on('click', event => {
            const $target = $(event.currentTarget);

            event.preventDefault();

            // update cart quantity
            cartUpdate($target);
        });

        // clear cart
        $('[data-cart-clear]', this.$cartContent).on('click', event => {
            event.preventDefault();
            apiCall(`/api/storefront/carts/${this.context.cartId}`, 'DELETE', {})
                .then(this.refreshContent(true, true));
        });

        // cart qty manually updates
        $('.cart-item-qty-input', this.$cartContent).on('focus', function onQtyFocus() {
            preVal = this.value;
        }).change(event => {
            const $target = $(event.currentTarget);
            event.preventDefault();
            event.stopImmediatePropagation();

            // update cart quantity
            cartUpdateQtyTextChange($target, preVal);
        });

        $('.cart-remove', this.$cartContent).on('click', event => {
            event.stopImmediatePropagation();
            const itemId = $(event.currentTarget).data('cartItemid');
            const string = $(event.currentTarget).data('confirmDelete');
            swal({
                text: string,
                type: 'warning',
                showCancelButton: true,
                cancelButtonText: this.context.cancelButtonText
            }).then(() => {
                // remove item from cart
                cartRemoveItem(itemId);
            });
            event.preventDefault();
        });

        $('[data-item-edit]', this.$cartContent).on('click', event => {
            const itemId = $(event.currentTarget).data('itemEdit');

            event.preventDefault();
            // edit item in cart
            this.cartEditOptions(itemId);
        });
    }

    bindPromoCodeEvents() {
        const $couponContainer = $('.coupon-code');
        const $couponForm = $('.coupon-form');
        const $codeInput = $('[name="couponcode"]', $couponForm);

        $('.coupon-code-add').on('click', event => {
            event.preventDefault();

            $(event.currentTarget).hide();
            $couponContainer.show();
            $('.coupon-code-cancel').show();
            $codeInput.trigger('focus');
        });

        $('.coupon-code-cancel').on('click', event => {
            event.preventDefault();

            $couponContainer.hide();
            $('.coupon-code-cancel').hide();
            $('.coupon-code-add').show();
        });

        $couponForm.on('submit', event => {
            const code = $codeInput.val();

            event.preventDefault();

            // Empty code
            if (!code) {
                return swal({
                    text: $codeInput.data('error'),
                    type: 'error',
                });
            }

            utils.api.cart.applyCode(code, (err, response) => {
                if (response.data.status === 'success') {
                    this.refreshContent();
                } else {
                    swal({
                        text: response.data.errors.join('\n'),
                        type: 'error',
                    });
                }
            });
        });
    }

    bindGiftCertificateEvents() {
        const $certContainer = $('.gift-certificate-code');
        const $certForm = $('.cart-gift-certificate-form');
        const $certInput = $('[name="certcode"]', $certForm);

        $('.gift-certificate-add').on('click', event => {
            event.preventDefault();
            $(event.currentTarget).toggle();
            $certContainer.toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $('.gift-certificate-cancel').on('click', event => {
            event.preventDefault();
            $certContainer.toggle();
            $('.gift-certificate-add').toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $certForm.on('submit', event => {
            const code = $certInput.val();

            event.preventDefault();

            if (!checkIsGiftCertValid(code)) {
                const validationDictionary = createTranslationDictionary(this.context);
                return swal.fire({
                    text: validationDictionary.invalid_gift_certificate,
                    icon: 'error',
                });
            }

            utils.api.cart.applyGiftCertificate(code, (err, resp) => {
                if (resp.data.status === 'success') {
                    this.refreshContent();
                } else {
                    swal({
                        text: resp.data.errors.join('\n'),
                        type: 'error',
                    });
                }
            });
        });
    }

    bindGiftWrappingEvents() {
        const modal = defaultModal();

        $('[data-item-giftwrap]').on('click', event => {
            const itemId = $(event.currentTarget).data('itemGiftwrap');
            const options = {
                template: 'cart/modals/gift-wrapping-form',
            };

            event.preventDefault();

            modal.open();

            utils.api.cart.getItemGiftWrappingOptions(itemId, options, (err, response) => {
                modal.updateContent(response.content);

                this.bindGiftWrappingForm();
            });
        });
    }

    bindGiftWrappingForm() {
        $('.giftWrapping-select').on('change', event => {
            const $select = $(event.currentTarget);
            const id = $select.val();
            const index = $select.data('index');

            if (!id) {
                return;
            }

            const allowMessage = $select.find(`option[value=${id}]`).data('allowMessage');

            $(`.giftWrapping-image-${index}`).hide();
            $(`#giftWrapping-image-${index}-${id}`).show();

            if (allowMessage) {
                $(`#giftWrapping-message-${index}`).show();
            } else {
                $(`#giftWrapping-message-${index}`).hide();
            }
        });

        $('.giftWrapping-select').trigger('change');

        function toggleViews() {
            const value = $('input:radio[name ="giftwraptype"]:checked').val();
            const $singleForm = $('.giftWrapping-single');
            const $multiForm = $('.giftWrapping-multiple');

            if (value === 'same') {
                $singleForm.show();
                $multiForm.hide();
            } else {
                $singleForm.hide();
                $multiForm.show();
            }
        }

        $('[name="giftwraptype"]').on('click', toggleViews);

        toggleViews();
    }

    bindEvents() {
        this.bindCartEvents();
        this.bindPromoCodeEvents();
        this.bindGiftWrappingEvents();
        this.bindGiftCertificateEvents();

        this.$form.on('click', '[data-save-cart]', event => {
            this.processForm(event, this.$form[0]);
        });

        this.$newList.on('click', event => {
            this.openAddList(event);
        });

        this.$document.on('click', '.add-new-list-form .button', event => {
            this.addNewList(event);
        });

        // initiate shipping estimator module
        const shippingErrorMessages = {
            country: this.context.shippingCountryErrorMessage,
            province: this.context.shippingProvinceErrorMessage
        }
        this.shippingEstimator = new ShippingEstimator($('[data-shipping-estimator]'), shippingErrorMessages);
    }
}
