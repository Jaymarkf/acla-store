import $ from 'jquery';

export default function () {
    if (!/Mobi/i.test(navigator.userAgent)) {
        // $('.navPages-list .navPages-item .navPages-action.has-subMenu').off('click');
    }
    $('.navPages-list .navPages-item > .navPages-action.has-subMenu').each(function eachMenu() {
        $(this).parent().hover(function showMenu() {
            $(this).children('.navPages-item > .navPages-action, .navPages-item > .navPage-subMenu').toggleClass('is-open');
            $(this).parent('.navPages-list').toggleClass('subMenu-is-open');
            $(this).children('.navPage-subMenu').stop(true).fadeIn(150);
        }, function hideMenu() {
            $(this).children('.navPages-item > .navPages-action, .navPages-item > .navPage-subMenu').stop(true).delay(500).toggleClass('is-open');
            $(this).parent('.navPages-list').toggleClass('subMenu-is-open');
            $(this).children('.navPage-subMenu').stop(true).delay(500).hide();
        });
    });
    $('.navPage-subMenu-list .navPage-subMenu-item-child > .navPage-subMenu-action.has-subMenu').each(function eachMenu() {
        $(this).parent().hover(function showMenu() {
            $(this).children('.navPage-subMenu-item-child > .navPage-subMenu-action, .navPage-subMenu-item-child > .navPage-subMenu').toggleClass('is-open');
            $(this).parent('.navPage-subMenu-list').toggleClass('subMenu-is-open');
            $(this).children('.navPage-subMenu').stop(true).fadeIn(150);
        }, function hideMenu() {
            $(this).children('.navPage-subMenu-item-child > .navPage-subMenu-action, .navPage-subMenu-item-child > .navPage-subMenu').stop(true).delay(500).toggleClass('is-open');
            $(this).parent('.navPage-subMenu-list').toggleClass('subMenu-is-open');
            $(this).children('.navPage-subMenu').stop(true).delay(500).hide();
        });
    });
}
