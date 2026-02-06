import PageManager from '../page-manager';
import utils from '@bigcommerce/stencil-utils';
import { parse } from 'papaparse';

export default class Page extends PageManager {
    onReady() {
        // Classes
        this.classRow = '.multi-add__row';
        this.classResultMessage = '.multi-add__result';
        this.classAddButton = '.multi-add__add-button';
        this.classRemoveButton = '.multi-add__remove-button';

        // Class names
        this.classNameRowError = 'multi-add__row--error';

        // Functional assignments
        this.$form = $('.multi-add');
        this.$file = $('.csv-file');
        this.snippet = $(this.classRow)[0].outerHTML;
        this.lines = 1;
        this.searchTerms = [];

        this.resetState();
        this.bindEvents();
    }

    resetState() {
        this.items = [];
        this.errors = [];
        this.currentLoop = 0;
    }

    // Loop errors, add class and change text
    handleErrors() {
        const skuError = this.context.skuError;

        $(this.errors).each((i, element) => {
            element.addClass(this.classNameRowError);
            // To add lang string
            element.children(this.classResultMessage).text(skuError);
        });
    }

    // Run AJAX calls one by one
    handleAjax() {
        if (this.currentLoop < this.items.length) {
            utils.api.getPage(this.items[this.currentLoop].url, {
                template: 'f/b2b/quick-add-response',
            }, (err, response) => {
                const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
                const cleanResponse = response.replace(scriptRegex, '').trim();

                if (err) {
                    throw new Error(err);
                }

                if (cleanResponse.length) {
                    this.items[this.currentLoop].target.children(this.classResultMessage).text(cleanResponse);
                    $(this.items[this.currentLoop].target).addClass('multi-add__row--advisory');
                } else {
                    this.items[this.currentLoop].target.children(this.classResultMessage).text($('.multi-add__submit-button').data('message'));
                    $(this.items[this.currentLoop].target).attr('data-status', 'success').addClass('multi-add__row--success');
                }

                // Increment 'current' and run AJAX call again
                this.currentLoop++;
                this.handleErrors();
                this.handleAjax();
            });
        }

        // Last attempt, redirect only
        if (this.currentLoop === this.items.length) {
            // document.location.href = '/cart.php';
            this.fetchCounter();
            $('.multi_add__cart-button').css('display', 'inline-block');
        }
    }

    fetchCounter() {
        utils.api.cart.getContent({ template: 'f/cart/item-count' }, (err, response) => {
            if (response > 0) {
                $('body').trigger('cart-quantity-update', response);
            }
        });
    }

    handleButtonDisplay() {
        const rows = this.$form.children(this.classRow);
        const removeButtons = rows.find(this.classRemoveButton);
        const addButtons = rows.find(this.classAddButton);
        const lastAddButton = $(rows[this.lines - 1]).find(this.classAddButton);

        if (this.lines > 1) {
            removeButtons.removeClass('multi-add__remove-button--last').removeAttr('disabled');
            addButtons.removeClass('multi-add__add-button--disabled').removeAttr('disabled', 'disabled');
            addButtons.not(lastAddButton).addClass('multi-add__add-button--disabled').attr('disabled', 'disabled');
        } else {
            removeButtons.addClass('multi-add__remove-button--last').attr('disabled', 'disabled');
            addButtons.removeClass('multi-add__add-button--disabled').removeAttr('disabled');
        }
    }

    handleAddLine(sku, qty) {
        const newLine = $(this.snippet).clone();

        if (sku && qty) {
            $(newLine[0].children[0]).val(sku);
            $(newLine[0].children[1]).val(qty);
        }

        $('.multi-add__submit-button').before(newLine);
        this.lines++;

        this.handleButtonDisplay();
    }

    handleRemoveLine(line) {
        if (line.is(':only-of-type')) {
            return;
        }

        line.remove();
        this.lines--;

        this.handleButtonDisplay();
    }

    handleItemSelect(event, override) {
        const self = (event) ? $(event.target) : override;
        const relativeRow = self.parents('.multi-add__row');
        const rowIndex = relativeRow.index() - 1;

        const selectedSku = $.trim(self.text());
        const relativeInput = relativeRow.find('[data-multi-sku]');

        relativeInput[0].value = selectedSku;
        this.searchTerms[rowIndex] = selectedSku;
    }

    processForm(event, form) {
        event.preventDefault();

        const allRows = $(form).children(this.classRow);
        const allMessages = allRows.find(this.classResultMessage);
        const addingtoCart = this.context.addingToCart;

        this.resetState();

        // For each row, add the URL and target to the items array
        allRows.each((index, row) => {
            const target = $(row);
            const sku = target.find('[data-multi-sku]').val();
            const qty = target.find('[data-multi-qty]').val();

            if (!sku || !qty) {
                this.errors.push(target);
                return;
            }

            const url = `/cart.php?action=add&sku=${sku}&qty=${qty}`;

            this.items.push({
                url,
                target,
            });
        });

        // To add lang string
        allMessages.text(addingtoCart);
        this.handleAjax();
    }

    parseCSV(event, _this) {
        $('.alertBox-message span').text('');
        $('.alertBox').hide();
        const file = event.target.files[0];
        let noSku;
        let noQty;
        const csvMissingSkuHeader = this.context.csvMissingSkuHeader;
        const csvMissingQtyHeader = this.context.csvMissingQtyHeader;

        parse(file, {
            preview: 1,
            complete(results) {
                if (results.data[0].indexOf('sku') === -1) {
                    noSku = true;
                }

                if (results.data[0].indexOf('qty') === -1) {
                    noQty = true;
                }

                if (noQty || noSku) {
                    if (noSku) {
                        $('.alertBox-message span').append(csvMissingSkuHeader);
                    }
                    if (noQty) {
                        $('.alertBox-message span').append(csvMissingQtyHeader);
                    }
                    $('.alertBox').show();
                } else {
                    parse(file, {
                        header: true,
                        dynamicTyping: false,
                        skipEmptyLines: true,
                        step(row) {
                            const sku = row.data[0].sku;
                            const qty = row.data[0].qty;
                            _this.handleAddLine(sku, qty);
                        },
                    });
                }
            },
        });
    }

    // Bind event handlers
    bindEvents() {
        this.$form.on('click', this.classAddButton, () => {
            this.handleAddLine();
        });

        this.$form.on('click', this.classRemoveButton, event => {
            this.handleRemoveLine($(event.target).parent());
        });

        this.$form.on('change', '[data-multi-sku]', event => {
            const self = $(event.target);

            if (self.val()) {
                self.siblings(this.classResultMessage).text('');
                self.parent().removeClass(this.classNameRowError);
            }
        });

        this.$form.on('submit', event => {
            this.processForm(event, this.$form[0]);
        });

        this.$file.on('change', event => {
            this.parseCSV(event, this);
        });
    }
}
