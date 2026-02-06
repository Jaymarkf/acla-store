export default function () {
    const $account = $('[data-account-menu]');

    $account.on('click', event => {
        if (/Mobi/i.test(navigator.userAgent) && $(window).width() <= 800) {
            return event.stopPropagation();
        }
    });
}
