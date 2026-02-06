export default function () {
    $('input[type=tel]').on('focusin mouseup', (event) => {
        $(event.target).select();
    });
}
