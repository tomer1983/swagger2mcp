import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { AuthService } from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Local Strategy (Username/Password)
 */
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await AuthService.authenticateLocal(email, password);
                return done(null, user);
            } catch (error: any) {
                return done(null, false, { message: error.message });
            }
        }
    )
);

/**
 * JWT Strategy (Token Authentication)
 */
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET,
        },
        async (jwtPayload, done) => {
            try {
                const user = await AuthService.getUserById(jwtPayload.userId);
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

/**
 * Microsoft OAuth2 Strategy
 */
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(
        new MicrosoftStrategy(
            {
                clientID: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/auth/microsoft/callback',
                scope: ['user.read'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Microsoft profile'), undefined);
                    }

                    const user = await AuthService.findOrCreateOAuthUser({
                        email,
                        provider: 'microsoft',
                        providerId: profile.id,
                        displayName: profile.displayName,
                    });

                    await AuthService.updateLastLogin(user.id);

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

/**
 * Serialize user for session (not used with JWT, but required by Passport)
 */
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

/**
 * Deserialize user from session (not used with JWT, but required by Passport)
 */
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await AuthService.getUserById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
