export default function () {
    const $cookieManager = $('#consent-manager-update-banner');

    if ($cookieManager) {
        $cookieManager.hide();
    }

    $('.consent-manager-update').on('click', (event) => {
        event.preventDefault();
        window.consentManager.openConsentManager();
    });
}
