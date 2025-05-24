import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';
import { IUser } from '../models/User'; // Assuming User model is for your app's user profile

dotenv.config();

const b2cTenantName = process.env.B2C_TENANT_NAME;
const signUpSignInPolicy = process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME;
const b2cClientId = process.env.B2C_CLIENT_ID; // Your API's Application (Client) ID in B2C

if (!b2cTenantName || !signUpSignInPolicy || !b2cClientId) {
  console.error(
    'Azure AD B2C configuration for token validation missing. Please set B2C_TENANT_NAME, B2C_SIGNUP_SIGNIN_POLICY_NAME, and B2C_CLIENT_ID.'
  );
  // Depending on policy, might not want to exit if some routes are public
}

const jwksUri = `https://${b2cTenantName}.b2clogin.com/${b2cTenantName}.onmicrosoft.com/${signUpSignInPolicy}/discovery/v2.0/keys`;

const client = jwksClient({
  jwksUri: jwksUri,
  cache: true, // Enable caching of signing keys
  rateLimit: true, // Enable rate limiting on JWKS endpoint
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('Token KID not found.'));
  }
  client.getSigningKey(header.kid, (err: Error | null, key?: jwksClient.SigningKey) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser | jwt.JwtPayload; // User profile from DB or decoded token payload
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    jwt.verify(token, getKey, { audience: b2cClientId /* issuer can also be checked */ }, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
      
      // `decoded` will contain the token claims. 
      // You can attach it to req.user or fetch your internal user profile.
      // For B2C, decoded.oid or decoded.sub usually contains the user's unique ID.
      req.user = decoded as jwt.JwtPayload; 
      
      // Optional: Find user in your DB using decoded.oid
      // const appUser = await User.findOne({ b2cObjectId: (decoded as any).oid });
      // if (appUser) {
      //   req.user = appUser; // Attach full app user profile
      // } else {
      //    // Handle user not found in DB - perhaps auto-register or deny access
      //    console.warn(`User with B2C OID ${(decoded as any).oid} not found in DB.`);
      // }

      next();
    });
  } catch (error) {
    console.error('Token verification general error:', error);
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}; 