import passport from 'passport';
import { ConfidentialClientApplication } from '@azure/msal-node';
export declare const msalInstance: ConfidentialClientApplication | null;
export declare const generateToken: (userId: string) => string;
export declare const exchangeB2CTokenForJWT: (b2cToken: string) => Promise<{
    token: string;
    user: any;
}>;
export default passport;
//# sourceMappingURL=passport.d.ts.map