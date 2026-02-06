/*
 Import all product specific js
 */
import PageManager from './page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import { classifyForm } from './common/form-utils';
import selectedOption from './f/selected-option';
import watchers from './f/watchers';
import optionsGrid from './f/options-grid';

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
    }

    onReady() {
        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails($('.productView, .product-description'), this.context, window.BCData.product_attributes);
        this.productDetails.setProductVariant();

        videoGallery();

        const $reviewForm = classifyForm('.writeReview-form');
        const review = new Review($reviewForm);

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        if (this.context.enableSelectedOptionLabel) {
            selectedOption();
        }

        const Sticky = require('sticky-js');
        const sticky = new Sticky('.sticky-product'); // eslint-disable-line no-unused-vars

        this.productReviewHandler();

        if (this.context.watchers) {
            watchers(this.context.watchers_min, this.context.watchers_max, this.context.watchers_update);
        }

        const optionsConfig = {
            taxPriceSettings: this.context.productTaxPriceSettings,
            taxDisplaySettings: this.context.productTaxDisplaySettings,
            taxLabel: this.context.productTaxLabel,
            dictionary: this.context.gridOrderingDictionary,
            columnLabels: this.context.productGridColumnLabels,
            enable: this.context.gridOrderingEnabled,
        };

        optionsGrid(this.context.productOptionsGql, this.context.productId, optionsConfig);
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }
}
