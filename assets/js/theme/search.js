import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import FacetedSearch from './common/faceted-search';
import compareProducts from './global/compare-products';
import urlUtils from './common/url-utils';
import Url from 'url';
import collapsibleFactory from './common/collapsible';
import 'jstree';
import nod from './common/nod';
import cardAddToCart from './f/card-add-to-cart';
import sideCart from './f/side-cart';
import gridSwitcher from './f/grid-list-switcher';

export default class Search extends CatalogPage {
    formatCategoryTreeForJSTree(node) {
        const nodeData = {
            text: node.data,
            id: node.metadata.id,
            state: {
                selected: node.selected,
            },
        };

        if (node.state) {
            nodeData.state.opened = node.state === 'open';
            nodeData.children = true;
        }

        if (node.children) {
            nodeData.children = [];
            node.children.forEach((childNode) => {
                nodeData.children.push(this.formatCategoryTreeForJSTree(childNode));
            });
        }

        return nodeData;
    }

    showProducts(navigate = true) {
        this.$contentResultsContainer.addClass('category--hide');

        this.$productListingContainer.removeClass('category--hide');
        this.$facetedSearchContainer.removeClass('category--hide');
        this.$productSideCart.removeClass('category--hide');
        this.$productOptions.removeClass('category--hide');
        this.$productPagination.removeClass('category--hide');

        $('[data-content-results-toggle]').removeClass('navBar-action-color--active');
        $('[data-content-results-toggle]').addClass('navBar-action');

        $('[data-product-results-toggle]').removeClass('navBar-action');
        $('[data-product-results-toggle]').addClass('navBar-action-color--active');

        if (this.context.enableSideCart) {
            sideCart();
        }

        if (!navigate) {
            return;
        }

        const searchData = $('#search-results-product-count span').data();
        const url = (searchData.count > 0) ? searchData.url : urlUtils.replaceParams(searchData.url, {
            page: 1,
        });

        urlUtils.goToUrl(url);
    }

    showContent(navigate = true) {
        this.$contentResultsContainer.removeClass('category--hide');

        this.$productListingContainer.addClass('category--hide');
        this.$facetedSearchContainer.addClass('category--hide');
        this.$productSideCart.addClass('category--hide');
        this.$productOptions.addClass('category--hide');
        this.$productPagination.addClass('category--hide');

        $('[data-product-results-toggle]').removeClass('navBar-action-color--active');
        $('[data-product-results-toggle]').addClass('navBar-action');

        $('[data-content-results-toggle]').removeClass('navBar-action');
        $('[data-content-results-toggle]').addClass('navBar-action-color--active');

        if (this.context.enableSideCart) {
            sideCart();
        }

        if (!navigate) {
            return;
        }

        const searchData = $('#search-results-content-count span').data();
        const url = (searchData.count > 0) ? searchData.url : urlUtils.replaceParams(searchData.url, {
            page: 1,
        });

        urlUtils.goToUrl(url);
    }

    onReady() {
        compareProducts(this.context);
        this.arrangeFocusOnSortBy();

        const $searchForm = $('[data-advanced-search-form]');
        const $categoryTreeContainer = $searchForm.find('[data-search-category-tree]');
        const url = Url.parse(window.location.href, true);
        const treeData = [];

        this.$contentResultsContainer = $('#search-results-content');

        this.$productListingContainer = $('#product-listing-container');
        this.$facetedSearchContainer = $('#faceted-search-container');
        this.$productSideCart = $('.product-sidecart');
        this.$productOptions = $('#product-options');
        this.$productPagination = $('#product-pagination');

        // Init faceted search
        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        if (this.context.enableSideCart) {
            sideCart();
        }

        cardAddToCart(this.context);

        gridSwitcher(this.context);

        // Init collapsibles
        collapsibleFactory();

        $('[data-product-results-toggle]').on('click', event => {
            event.preventDefault();
            this.showProducts();
        });

        $('[data-content-results-toggle]').on('click', event => {
            event.preventDefault();
            this.showContent();
        });

        if (this.$productListingContainer.find('li.productCard').length === 0 || url.query.section === 'content') {
            this.showContent();
        } else {
            this.showProducts();
        }

        const validator = this.initValidation($searchForm)
            .bindValidation($searchForm.find('#search_query_adv'));

        this.context.categoryTree.forEach((node) => {
            treeData.push(this.formatCategoryTreeForJSTree(node));
        });

        this.categoryTreeData = treeData;
        this.createCategoryTree($categoryTreeContainer);

        $searchForm.on('submit', event => {
            const selectedCategoryIds = $categoryTreeContainer.jstree().get_selected();

            if (!validator.check()) {
                return event.preventDefault();
            }

            $searchForm.find('input[name="category\[\]"]').remove();

            for (const categoryId of selectedCategoryIds) {
                const input = $('<input>', {
                    type: 'hidden',
                    name: 'category[]',
                    value: categoryId,
                });

                $searchForm.append(input);
            }
        });
    }

    loadTreeNodes(node, cb) {
        $.ajax({
            url: '/remote/v1/category-tree',
            data: {
                selectedCategoryId: node.id,
                prefix: 'category',
            },
            headers: {
                'x-xsrf-token': window.BCData && window.BCData.csrf_token ? window.BCData.csrf_token : '',
            },
        }).done(data => {
            const formattedResults = [];

            data.forEach((dataNode) => {
                formattedResults.push(this.formatCategoryTreeForJSTree(dataNode));
            });

            cb(formattedResults);
        });
    }

    createCategoryTree($container) {
        const treeOptions = {
            core: {
                data: (node, cb) => {
                    // Root node
                    if (node.id === '#') {
                        cb(this.categoryTreeData);
                    } else {
                        // Lazy loaded children
                        this.loadTreeNodes(node, cb);
                    }
                },
                themes: {
                    icons: true,
                },
            },
            checkbox: {
                three_state: false,
            },
            plugins: [
                'checkbox',
            ],
        };

        $container.jstree(treeOptions);
    }

    initFacetedSearch() {
        const $productListingContainer = $('#product-listing-container');
        const $contentListingContainer = $('#search-results-content');
        const $facetedSearchContainer = $('#faceted-search-container');
        const $searchHeading = $('#search-results-heading');
        const $searchCount = $('#search-results-product-count');
        const $contentCount = $('#search-results-content-count');
        const productsPerPage = this.context.searchProductsPerPage;
        const requestOptions = {
            template: {
                productListing: 'f/search/product-listing',
                contentListing: 'f/search/content-listing',
                sidebar: 'search/sidebar',
                heading: 'f/search/heading',
                productCount: 'search/product-count',
                contentCount: 'search/content-count',
            },
            config: {
                product_results: {
                    limit: productsPerPage,
                },
            },
            showMore: 'search/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $searchHeading.html(content.heading);

            const url = Url.parse(window.location.href, true);
            if (url.query.section === 'content') {
                $contentListingContainer.html(content.contentListing);
                $contentCount.html(content.contentCount);
                this.showContent(false);
            } else {
                $productListingContainer.html(content.productListing);
                $facetedSearchContainer.html(content.sidebar);
                $searchCount.html(content.productCount);
                this.showProducts(false);
            }

            $('html, body').animate({
                scrollTop: 0,
            }, 100);

            cardAddToCart(this.context);
            gridSwitcher(this.context);

            if (this.context.enableSideCart) {
                sideCart();
            }
        });
    }

    initValidation($form) {
        this.$form = $form;
        this.validator = nod({
            submit: $form,
        });

        return this;
    }

    bindValidation($element) {
        if (this.validator) {
            this.validator.add({
                selector: $element,
                validate: 'presence',
                errorMessage: $element.data('errorMessage'),
            });
        }

        return this;
    }

    check() {
        if (this.validator) {
            this.validator.performCheck();
            return this.validator.areAll('valid');
        }

        return false;
    }
}
