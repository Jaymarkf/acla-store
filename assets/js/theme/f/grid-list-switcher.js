import Cookies from 'js-cookie';

export default function (context) {
    const displayMode = Cookies.get('categoryView') || context.displayMode;
    $(`.switch-${displayMode}`).addClass('switch-active');

    function switchDisplay(mode) {
        $('.category, .page, .productCards, .productCard').removeClass('category--list page--list productCards--list productCard--list productCards--grid productCard--grid');

        $('.category').addClass(`category--${mode}`);
        $('.page').addClass(`page--${mode}`);
        $('.productCards').addClass(`productCards--${mode}`);
        $('.productCard').addClass(`productCard--${mode}`);
    }

    switchDisplay(displayMode);

    $('[data-display-switch]').on('click', (event) => {
        event.preventDefault();
        const displayType = $(event.currentTarget).attr('data-display-switch');

        Cookies.set('categoryView', displayType, { expires: 30 });

        $('[data-display-switch]').removeClass('switch-active');
        $(event.currentTarget).addClass('switch-active');

        switchDisplay(displayType);
    });
}
