import utils from '@bigcommerce/stencil-utils';

export default function countdown(targetMinutes, targetElement, endMessage) {
    const countdownTarget = document.getElementById(targetElement);

    if (countdownTarget) {
        let timer = targetMinutes * 60;

        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem(targetElement)) {
                timer = localStorage.getItem(targetElement) * 60;
            }
        }

        const countdownTimer = setInterval(() => {
            let mins = Math.floor(timer / 60);
            let secs = timer % 60;

            if (mins < 10) {
                mins = `0${mins}`;
            }

            if (secs < 10) {
                secs = `0${secs}`;
            }

            if (timer > 0) {
                countdownTarget.innerHTML = `${mins}:${secs}`;
                timer -= 1;
                if (utils.tools.storage.localStorageAvailable()) {
                    localStorage.setItem(targetElement, mins);
                }
            } else {
                countdownTarget.parentElement.innerHTML = endMessage;
                clearInterval(countdownTimer);
                if (utils.tools.storage.localStorageAvailable()) {
                    localStorage.removeItem(targetElement);
                }
            }
        }, 1000);
    }
}
