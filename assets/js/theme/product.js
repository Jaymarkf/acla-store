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
import { InitCustomFeature } from './common/custom-jay-v2';
export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
    }

    onReady() {
        this.initColors();
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

async fetchVariantsWhenDOMReady() {
    const optionContainer = document.querySelector('[data-product-option-change]');
    if (!optionContainer) return [];

    const allVariants = [];
    let hasNextPage = true;
    let afterCursor = null;

    while (hasNextPage) {
        const query = `
        query ProductVariantsWithLabels($productId: Int!, $after: String) {
            site {
                product(entityId: $productId) {
                    name
                    variants(first: 250, after: $after) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                sku
                                entityId
                                productOptions {
                                    edges {
                                        node {
                                            entityId
                                            displayName
                                            ... on MultipleChoiceOption {
                                                values {
                                                    edges {
                                                        node {
                                                            label
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`;

        const res = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.context.authorization}`,
            },
            body: JSON.stringify({
                query,
                variables: { 
                    productId: this.context.productId,
                    after: afterCursor 
                },
            }),
        });

        const json = await res.json();
        const product = json.data.site.product;

        // Flatten each variant → extract SKU + entityId + label
        product.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            const optionNode = variant.productOptions.edges[0]?.node;
            const label = optionNode?.values.edges[0]?.node.label || '';

            allVariants.push({
                sku: variant.sku,
                entityId: variant.entityId,
                label
            });
        });

        hasNextPage = product.variants.pageInfo.hasNextPage;
        afterCursor = product.variants.pageInfo.endCursor;
    }

   
    // Render SKUs and labels in front-end
    const labels = optionContainer.querySelectorAll('label[data-product-attribute-value]');
    const strongMap = [];
    let longestSku = '';
    let longestStrongEl = null;

labels.forEach(labelEl => {
    const labelText = labelEl.textContent.trim().toLowerCase(); // DOM label text
    // Find the variant whose label matches this text
    const variant = allVariants.find(v => v.label.toLowerCase() === labelText);

    if (!variant) return;

    labelEl.setAttribute('custom-attribute-sku', variant.sku);
    labelEl.setAttribute('data-label', variant.label);

    // prevent duplicate <strong>
    if (!labelEl.querySelector('strong')) {

        const text = labelEl.textContent.trim(); // original label text

        labelEl.innerHTML = `
            <strong>${variant.sku}</strong>
            <span class="variant-label">${text}</span>
        `;
    }

    const strongEl = labelEl.querySelector('strong');
    strongEl.style.display = 'inline-block';
    strongEl.style.padding = '2px 4px';
    strongEl.style.borderRadius = '3px';

    const hex = window.Colors[variant.sku];
    if (hex) {
        strongEl.style.backgroundColor = hex;
        strongEl.style.color = this.isDarkColor(hex) ? '#ffffff' : '#000000';
    }

    strongMap.push(strongEl);

    if (variant.sku.length > longestSku.length) {
        longestSku = variant.sku;
        longestStrongEl = strongEl;
    }
});

    requestAnimationFrame(() => {
        if (!longestStrongEl) return;

        // reset widths first
        strongMap.forEach(el => el.style.width = 'auto');

        const longestWidth = longestStrongEl.scrollWidth + 10;

        strongMap.forEach(el => {
            el.style.width = longestWidth + 'px';
            el.style.textAlign = 'left';
        });
    });

    return allVariants;
}



initColors() {
    this.fetchVariantsWhenDOMReady().then(() => {
        InitCustomFeature();
        const colorsMap = window.Colors; // { 'OMB-B0-2': '#00ff00', ... }

        const optionContainer = document.querySelector('[data-product-option-change]');
        if (!optionContainer) return;

        // Handle custom attribute click for quantity
        const $customOptions = $('[custom-attribute-cart-quantity]');
        $customOptions.each(function () {
            $(this).on('click', function () {
                const quantity = this.getAttribute('custom-attribute-cart-quantity');
                $('input[id="qty[]"]').val(quantity || 0);
            });
        });
    });
}







isDarkColor(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

    // Perceived brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 140;
}



}
