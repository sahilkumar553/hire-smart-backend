import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in cookies or Authorization header
        const token = req.cookies.token || 
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? 
             req.headers.authorization.split(' ')[1] : null);

        if (!token) {
            console.log('No authentication token found');
            return res.status(401).json({
                message: "Authentication required. No token provided.",
                success: false,
            });
        }

        // Log token existence (without exposing actual token)
        console.log(`Token found: ${token ? 'Yes' : 'No'}`);

        try {
            const decode = jwt.verify(token, process.env.SECRET_KEY);
            
            if (!decode) {
                return res.status(401).json({
                    message: "Invalid token",
                    success: false
                });
            }

            req.id = decode.userId;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                message: "Token validation failed",
                error: jwtError.message,
                success: false
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            message: "Server authentication error",
            error: error.message,
            success: false
        });
    }
}

export default isAuthenticated;