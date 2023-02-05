import { Route } from '@kastelll/packages';
import Constants from '../../Constants';
import Captcha from '../../Middleware/Captcha';

new Route('/forgot', 'POST', [
    Captcha({
        Enabled: Constants.Settings.Captcha.ForgotPassword
    })
], async (req, res) => {});