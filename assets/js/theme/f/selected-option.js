export default function () {
    const $src = $('.show-selected-option input');
    const $selected = $('.show-selected-option input[checked]');
    let $selectedOptionLabel;
    let $selectedOption;

    function changeLabel() {
        $selectedOptionLabel = $(this).siblings().children('span[data-option-value]');
        $selectedOption = $(this).attr('data-option-label');

        $selectedOptionLabel.text($selectedOption);
    }

    $selected.each(changeLabel);
    $src.on('click', changeLabel);
}
