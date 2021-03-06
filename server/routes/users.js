import express from 'express';
import { Users } from '../controllers';
import { ValidateUser, AuthenticateUser, ValidatePasswordReset } from '../middlewares';
import passport from '../config/passport';

const authRoute = express.Router();

// signup a new user
authRoute.post('/users',
  ValidateUser.validateMethods(),
  ValidateUser.validateUserDetails,
  Users.signupUser);

// login an existing user
authRoute.post('/users/login',
  ValidateUser.validateLoginFields(),
  ValidateUser.validateLogin,
  AuthenticateUser.verifyActiveUser,
  Users.loginUser);

// verifies new users email
authRoute.get('/users/verifyemail', Users.verifyUserEmail);

// Sends Password reset link to a verified users email address
authRoute.post('/users/reset-password', Users.resetPasswordEmail);

// Resets password
authRoute.patch('/users/reset-password',
  ValidatePasswordReset.checkResetPassword(),
  ValidatePasswordReset.checkForErrors,
  Users.resetPassword);

authRoute.get('/users/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

authRoute.get('/users/auth/google/redirect',
  AuthenticateUser.verifySocialLogin,
  passport.authenticate('google', { session: false }),
  AuthenticateUser.verifyActiveUser,
  Users.socialLogin);
authRoute.get('/users/auth/facebook',
  passport.authenticate('facebook', {
    scope: ['email']
  }));

authRoute.get('/users/auth/facebook/redirect',
  AuthenticateUser.verifySocialLogin,
  passport.authenticate('facebook', { session: false }),
  AuthenticateUser.verifyActiveUser,
  Users.socialLogin);

authRoute.get('/users/auth/twitter',
  passport.authenticate('twitter', {
    scope: ['include_email=true']
  }));

authRoute.get('/users/auth/twitter/redirect',
  AuthenticateUser.verifySocialLogin,
  passport.authenticate('twitter', { session: false }),
  AuthenticateUser.verifyActiveUser,
  Users.socialLogin);

// Get users stats
authRoute.get('/users/stats',
  AuthenticateUser.verifyUser,
  AuthenticateUser.verifyActiveUser,
  Users.getStats);

// Send Timed Reactivation Link To Users Email
authRoute.post('/users/reactivate', ValidateUser.validateEmail, Users.sendReactivationLink);

// Reactivate users account
authRoute.get('/users/reactivate', Users.reactivateUser);

// Deactivate a user
authRoute.post('/users/deactivate',
  AuthenticateUser.verifyUser,
  AuthenticateUser.verifyActiveUser,
  ValidateUser.validateUserDeactivation,
  Users.deactivateUser);

export default authRoute;
