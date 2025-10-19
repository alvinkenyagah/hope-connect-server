const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT in the Authorization header.
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token and get user id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token ID and attach to request
            // .select('-password') removes the password field
            req.user = await User.findById(decoded.id).select('-password'); 

            if (!req.user) {
                return res.status(401).json({ message: 'User not found. Token is invalid.' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
});

/**
 * Grants access only if the user's role matches one of the allowed roles.
 * @param {string[]} roles - Array of roles allowed to access the route (e.g., ['admin', 'counselor']).
 */
exports.authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route.`
            });
        }
        next();
    };
};