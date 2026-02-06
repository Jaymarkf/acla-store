import PageManager from './page-manager';
import apiCall from './f/api';

export default class Home extends PageManager {
    handlePasswordlessLogin(email, redirectUrl) {
        apiCall('/login.php?action=passwordless_login', 'POST', {
            email,
            redirect_url: redirectUrl,
        }).then(() => {
            $('.login-email-sent').css('visibility', 'visible');
        });
    }

    onReady() {
        $('.login-form-email').on('submit', event => {
            event.preventDefault();

            const email = $('#login_email').val();
            const redirectUrl = this.context.passwordlessRedirectUrl;

            this.handlePasswordlessLogin(email, redirectUrl);
        });

        $('.login-email-redo').on('click', event => {
            event.preventDefault();
            $('.login-email-sent').css('visibility', 'hidden');
        });
    }
}
