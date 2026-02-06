import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import maintenanceMode from './global/maintenanceMode';
import carousel from './common/carousel';
import loadingProgressBar from './global/loading-progress-bar';
import svgInjector from './global/svg-injector';
import quickAddSkus from './f/quick-add-sku';
import accountMenu from './f/account-menu';
import autoHighlight from './f/auto-highlight';
import cardAddToCart from './f/card-add-to-cart';
import hoverNavigation from './f/hover-navigation';
import recentSellers from './f/recent-sellers';

export default class Global extends PageManager {
    onReady() {
        cartPreview(this.context.secureBaseUrl, this.context.cartId, this.context.disableMinicart, this.context.enableSideCart);
        quickSearch();
        currencySelector();
        foundation($(document));
        quickView(this.context);
        carousel();
        mobileMenuToggle();
        privacyCookieNotification();
        maintenanceMode(this.context.maintenanceMode);
        loadingProgressBar();
        quickAddSkus(this.context);
        autoHighlight();
        cardAddToCart(this.context);
        svgInjector();
        accountMenu();
        if (!/Mobi/i.test(navigator.userAgent) && this.context.enableRecentSellers) {
            recentSellers(this.context.recentSellersTimer, this.context.recentSellersHideAfter, this.context);
        }

        if (!/Mobi/i.test(navigator.userAgent) && this.context.enableHoverNavigation) {
            hoverNavigation();
        } else {
            menu();
        }

        if (window.ApplePaySession) {
            $('.apple-pay-checkout-button').show();
        }
    }
}
