/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     description: >
 *       Registers a new user in the system and sends a verification email.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Unique username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (unique)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (minimum 6 characters)
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *               bio:
 *                 type: string
 *                 description: User bio or description
 *               gender:
 *                 type: string
 *                 description: Gender
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (ISO format)
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of interest names
 *               profilePhotoUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to profile photo
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier for login tracking
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceName:
 *                     type: string
 *                   deviceModel:
 *                     type: string
 *                   osVersion:
 *                     type: string
 *                   appVersion:
 *                     type: string
 *     responses:
 *       201:
 *         description: User registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful! Please check your email to verify your account.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for immediate authentication
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email or username already exists
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

// import { NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import crypto from 'crypto';
// import jwt from 'jsonwebtoken';
// import { z } from 'zod';
// import { generateVerificationCode, sendVerificationCodeEmail } from '@/lib/email';

// import { prisma } from '@/lib/prisma';

// // Username validation helper
// function isValidUsername(username: string): boolean {
//     // Only allow alphanumeric characters, underscores, and periods
//     // Must be 3-30 characters long
//     const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
//     return usernameRegex.test(username);
// }

// // Password strength validation helper
// function isStrongPassword(password: string): { isValid: boolean; message: string } {
//     if (password.length < 8) {
//         return { isValid: false, message: "Password must be at least 8 characters long" };
//     }

//     // Check for at least one uppercase letter
//     if (!/[A-Z]/.test(password)) {
//         return { isValid: false, message: "Password must contain at least one uppercase letter" };
//     }

//     // Check for at least one lowercase letter
//     if (!/[a-z]/.test(password)) {
//         return { isValid: false, message: "Password must contain at least one lowercase letter" };
//     }

//     // Check for at least one number
//     if (!/[0-9]/.test(password)) {
//         return { isValid: false, message: "Password must contain at least one number" };
//     }

//     // Check for at least one special character
//     if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
//         return { isValid: false, message: "Password must contain at least one special character" };
//     }

//     return { isValid: true, message: "" };
// }

// // Calculate age from date of birth
// function calculateAge(dateOfBirth: Date): number {
//     const today = new Date();
//     let age = today.getFullYear() - dateOfBirth.getFullYear();
//     const monthDifference = today.getMonth() - dateOfBirth.getMonth();

//     if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
//         age--;
//     }

//     return age;
// }

// // Request body validation schema
// // Update the registerSchema in /auth/register route
// const registerSchema = z.object({
//     username: z.string()
//         .min(3, { message: "Username must be at least 3 characters" })
//         .max(30, { message: "Username cannot exceed 30 characters" })
//         .refine(val => isValidUsername(val), {
//             message: "Username can only contain letters, numbers, underscores, and periods"
//         }),
//     email: z.string().email({ message: "Invalid email address" }),
//     password: z.string()
//         .min(8, { message: "Password must be at least 8 characters" })
//         .refine((val: string) => isStrongPassword(val).isValid, {
//             message: "Password must meet the strength requirements"
//         }),
//     confirmPassword: z.string(),
//     firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
//     lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
//     bio: z.string().max(80, { message: "Bio cannot exceed 80 characters" }).optional(),
//     gender: z.string().optional(),
//     dateOfBirth: z.string()
//         .transform(val => new Date(val))
//         .refine(val => !isNaN(val.getTime()), {
//             message: "Invalid date format"
//         })
//         .refine(val => calculateAge(val) >= 13, {
//             message: "You must be at least 13 years old to register"
//         }),
//     interests: z.array(z.string()).optional(),
//     profilePhotoUrl: z.string().url().optional().nullable(),
//     // Add security fields
//     pin: z.string().length(4).regex(/^\d{4}$/, { message: "PIN must be 4 digits" }).optional(),
//     useFingerprint: z.boolean().optional(),
//     useFaceId: z.boolean().optional(),
//     // Device fields
//     deviceId: z.string().optional(),
//     deviceInfo: z.object({
//         deviceName: z.string().optional(),
//         deviceModel: z.string().optional(),
//         osVersion: z.string().optional(),
//         appVersion: z.string().optional(),
//     }).optional(),
// }).refine(data => data.password === data.confirmPassword, {
//     message: "Passwords do not match",
//     path: ["confirmPassword"],
// });

// const verificationCode = generateVerificationCode(6);

// // Set expiration time (10 minutes from now)
// const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

// export async function POST(request: Request) {
//     try {
//         const body = await request.json();

//         // Validate request body
//         const validationResult = registerSchema.safeParse(body);
//         if (!validationResult.success) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: 'Validation error',
//                     errors: validationResult.error.errors
//                 },
//                 { status: 400 }
//             );
//         }

//         const {
//             username,
//             email,
//             password,
//             firstName,
//             lastName,
//             bio,
//             gender,
//             dateOfBirth,
//             interests,
//             profilePhotoUrl,
//             deviceId,
//             deviceInfo
//         } = validationResult.data;

//         // Check if email or username already exists
//         const existingUser = await prisma.user.findFirst({
//             where: {
//                 OR: [
//                     { email },
//                     { username }
//                 ]
//             }
//         });

//         if (existingUser) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: existingUser.email === email
//                         ? 'Email already in use'
//                         : 'Username already taken'
//                 },
//                 { status: 409 }
//             );
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Generate verification token
//         const verificationToken = crypto.randomBytes(32).toString('hex');

//         // Create user with transaction to handle interests
//         const userData = await prisma.$transaction(async (tx) => {
//             // Create the user first
//             const newUser = await tx.user.create({
//                 data: {
//                     username,
//                     email,
//                     passwordHash: hashedPassword,
//                     firstName,
//                     lastName,
//                     fullName: `${firstName} ${lastName}`,
//                     bio,
//                     gender,
//                     dateOfBirth,
//                     profilePhotoUrl,
//                     verificationCode,
//                     verificationCodeExpiry,
//                 },
//             });

//             // Add interests if provided
//             if (interests && interests.length > 0) {
//                 for (const interestName of interests) {
//                     // Create the interest if it doesn't exist
//                     await tx.interest.upsert({
//                         where: { name: interestName },
//                         update: {},
//                         create: { name: interestName },
//                     });
//                 }

//                 // Connect interests to user
//                 await tx.user.update({
//                     where: { id: newUser.id },
//                     data: {
//                         interests: {
//                             connect: interests.map(name => ({ name })),
//                         },
//                     },
//                 });
//             }

//             // Record device if provided
//             if (deviceId) {
//                 const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

//                 await tx.deviceHistory.create({
//                     data: {
//                         userId: newUser.id,
//                         deviceId,
//                         deviceName: deviceInfo?.deviceName,
//                         deviceModel: deviceInfo?.deviceModel,
//                         osVersion: deviceInfo?.osVersion,
//                         appVersion: deviceInfo?.appVersion,
//                         ipAddress,
//                         isActive: true,
//                     },
//                 });
//             }

//             // Return user with interests
//             return tx.user.findUnique({
//                 where: { id: newUser.id },
//                 include: {
//                     interests: {
//                         select: {
//                             id: true,
//                             name: true,
//                         },
//                     },
//                 },
//             });
//         });

//         if (!userData) {
//             throw new Error('Failed to create user');
//         }

//         // Send verification email with code
//         await sendVerificationCodeEmail(email, firstName, verificationCode);

//         // For development/testing, include the verification code in the response
//         // In production, remove this or use a feature flag
//         const devInfo = process.env.NODE_ENV === 'development'
//             ? { verificationCode }
//             : {};

//         // Generate JWT token for immediate authentication
//         const token = jwt.sign(
//             {
//                 userId: userData.id,
//                 email: userData.email,
//                 role: userData.role,
//                 username: userData.username
//             },
//             process.env.JWT_SECRET as string,
//             { expiresIn: '24h' }
//         );

//         // Generate refresh token
//         const refreshToken = jwt.sign(
//             { userId: userData.id },
//             process.env.JWT_REFRESH_SECRET as string,
//             { expiresIn: '7d' }
//         );

//         // Update last login timestamp
//         await prisma.user.update({
//             where: { id: userData.id },
//             data: { lastLoginAt: new Date() },
//         });

//         // Remove sensitive information from the response
//         const {
//             passwordHash,
//             verificationCode: _code,
//             verificationCodeExpiry: _expiry,
//             forgotPasswordToken,
//             forgotPasswordExpiry,
//             pin,
//             ...userWithoutSensitiveData
//         } = userData;

//         return NextResponse.json(
//             {
//                 success: true,
//                 message: 'Registration successful! Please verify your email with the code sent to your email address.',
//                 user: userWithoutSensitiveData,
//                 token,
//                 refreshToken,
//                 ...devInfo
//             },
//             { status: 201 }
//         );
//     } catch (error: any) {
//         console.error('Registration error:', error);
//         return NextResponse.json(
//             { success: false, message: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }




import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { generateVerificationCode, sendVerificationCodeEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// --- Best Practice: Move the following Error utilities to a separate file (e.g., /lib/errors.ts) ---

/**
 * A collection of unique error codes for the API.
 */
export const ApiErrorCodes = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    EMAIL_IN_USE: 'EMAIL_IN_USE',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    USER_CREATION_FAILED: 'USER_CREATION_FAILED',
    EMAIL_SERVICE_FAILURE: 'EMAIL_SERVICE_FAILURE',
    JWT_SECRET_MISSING: 'JWT_SECRET_MISSING',
    UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

/**
 * Custom error class for handling API-specific errors with status codes.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;

    constructor(message: string, statusCode: number, errorCode: string) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

// --- End of Error utilities ---


// Username validation helper
function isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
    return usernameRegex.test(username);
}

// Password strength validation helper
function isStrongPassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character" };
    }
    return { isValid: true, message: "" };
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age;
}

// Request body validation schema
const registerSchema = z.object({
    username: z.string()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(30, { message: "Username cannot exceed 30 characters" })
        .refine(val => isValidUsername(val), {
            message: "Username can only contain letters, numbers, underscores, and periods"
        }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val: string) => isStrongPassword(val).isValid, {
            message: "Password must meet the strength requirements"
        }),
    confirmPassword: z.string(),
    firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
    bio: z.string().max(80, { message: "Bio cannot exceed 80 characters" }).optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string()
        .transform(val => new Date(val))
        .refine(val => !isNaN(val.getTime()), { message: "Invalid date format" })
        .refine(val => calculateAge(val) >= 13, { message: "You must be at least 13 years old to register" }),
    interests: z.array(z.string()).optional(),
    profilePhotoUrl: z.string().url().optional().nullable(),
    pin: z.string().length(4).regex(/^\d{4}$/, { message: "PIN must be 4 digits" }).optional(),
    useFingerprint: z.boolean().optional(),
    useFaceId: z.boolean().optional(),
    deviceId: z.string().optional(),
    deviceInfo: z.object({
        deviceName: z.string().optional(),
        deviceModel: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string().optional(),
    }).optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errorCode: ApiErrorCodes.VALIDATION_FAILED,
                    errors: validationResult.error.errors,
                },
                { status: 400 }
            );
        }

        const {
            username, email, password, firstName, lastName, bio, gender,
            dateOfBirth, interests, profilePhotoUrl, deviceId, deviceInfo
        } = validationResult.data;

        // Check if email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });

        if (existingUser) {
            const isEmailConflict = existingUser.email === email;
            return NextResponse.json(
                {
                    success: false,
                    message: isEmailConflict ? 'Email already in use' : 'Username already taken',
                    errorCode: isEmailConflict ? ApiErrorCodes.EMAIL_IN_USE : ApiErrorCodes.USERNAME_TAKEN,
                },
                { status: 409 } // 409 Conflict is the appropriate status code here
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

   
        const verificationCode = generateVerificationCode(6);
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Create user with transaction to handle interests
        const userData = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username, email, passwordHash: hashedPassword, firstName, lastName,
                    fullName: `${firstName} ${lastName}`, bio, gender, dateOfBirth,
                    profilePhotoUrl, verificationCode, verificationCodeExpiry, role: 'USER',
                },
            });

            if (interests && interests.length > 0) {
                for (const interestName of interests) {
                    await tx.interest.upsert({
                        where: { name: interestName },
                        update: {},
                        create: { name: interestName },
                    });
                }
                await tx.user.update({
                    where: { id: newUser.id },
                    data: { interests: { connect: interests.map(name => ({ name })) } },
                });
            }

            if (deviceId) {
                const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
                await tx.deviceHistory.create({
                    data: {
                        userId: newUser.id, deviceId, deviceName: deviceInfo?.deviceName,
                        deviceModel: deviceInfo?.deviceModel, osVersion: deviceInfo?.osVersion,
                        appVersion: deviceInfo?.appVersion, ipAddress, isActive: true,
                    },
                });
            }

            return tx.user.findUnique({
                where: { id: newUser.id },
                include: { interests: { select: { id: true, name: true } } },
            });
        });

        if (!userData) {
            throw new ApiError('Failed to create user record in the database.', 500, ApiErrorCodes.USER_CREATION_FAILED);
        }

        // Send verification email with code, with specific error handling
        try {
            await sendVerificationCodeEmail(email, firstName, verificationCode);
        } catch (emailError) {
            console.error('Email service failure:', emailError);
            throw new ApiError('Account was created, but failed to send verification email.', 503, ApiErrorCodes.EMAIL_SERVICE_FAILURE);
        }

        // For development/testing, include the verification code in the response
        const devInfo = process.env.NODE_ENV === 'development' ? { verificationCode } : {};

        // Check for server configuration before generating tokens
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error('FATAL: JWT_SECRET or JWT_REFRESH_SECRET is not defined in .env file.');
            throw new ApiError('Server is not configured correctly for authentication.', 500, ApiErrorCodes.JWT_SECRET_MISSING);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: userData.id, email: userData.email, role: userData.role, username: userData.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: userData.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Update last login timestamp
        await prisma.user.update({
            where: { id: userData.id },
            data: { lastLoginAt: new Date() },
        });

        // Remove sensitive information from the response object
        const { passwordHash, verificationCode: _code, verificationCodeExpiry: _expiry, forgotPasswordToken, forgotPasswordExpiry, pin, ...userWithoutSensitiveData } = userData as any;

        return NextResponse.json(
            {
                success: true,
                message: 'Registration successful! Please verify your email with the code sent to your email address.',
                user: userWithoutSensitiveData,
                token,
                refreshToken,
                ...devInfo,
            },
            { status: 201 }
        );
    } catch (error: any) {
        // --- This is the "smart" error handler ---
        if (error instanceof ApiError) {
            // This is a controlled, known error we threw on purpose
            console.error(`API Error [${error.errorCode}]: ${error.message}`);
            return NextResponse.json(
                { success: false, message: error.message, errorCode: error.errorCode },
                { status: error.statusCode }
            );
        }

        // This is a true, unexpected error (e.g., Prisma client crash, syntax error)
        console.error('Unexpected Registration Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'An unexpected internal server error occurred.',
                errorCode: ApiErrorCodes.UNEXPECTED_ERROR,
            },
            { status: 500 }
        );
    }
}
