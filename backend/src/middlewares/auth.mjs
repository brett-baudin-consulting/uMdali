import passport from 'passport';

export const skipAuth = (req, res, next) => {
    if (process.env.DISABLE_AUTH === 'true') {
        return next();
    }
    return passport.authenticate('ldapauth', { session: false })(req, res, next);
};  