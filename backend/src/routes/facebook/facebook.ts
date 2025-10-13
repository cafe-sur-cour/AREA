import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { facebookOAuth } from '../../services/services/facebook/oauth';
import { connect } from 'http2';


const router = express.Router();


router.get('/login/status', token,
    async (req: Request, res: Response) => {
        try {
            const userID = (req.auth as { id: number }).id;
            const userToken = await facebookOAuth.getUserToken(userID);

            if (!userToken) {
                return res.status(404).json({
                    error: 'No valid Facebook access token found for user',
                });
            }

            return res.status(200).json({
                connected: true,
                token_expires_at: userToken.expires_at,
                scopes: userToken.scopes,
            });
        } catch (error) {
            console.error('Error checking Facebook login status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);
























// <script>
//   window.fbAsyncInit = function() {
//     FB.init({
//       appId      : '{your-app-id}',
//       cookie     : true,
//       xfbml      : true,
//       version    : '{api-version}'
//     });
      
//     FB.AppEvents.logPageView();   
      
//   };

//   (function(d, s, id){
//      var js, fjs = d.getElementsByTagName(s)[0];
//      if (d.getElementById(id)) {return;}
//      js = d.createElement(s); js.id = id;
//      js.src = "https://connect.facebook.net/en_US/sdk.js";
//      fjs.parentNode.insertBefore(js, fjs);
//    }(document, 'script', 'facebook-jssdk'));
// </script>
