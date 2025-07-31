import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Next.js Prisma API',
            version: '1.0.0',
            description: 'API documentation for a Next.js app with Prisma',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
            },
        ],
    },
    apis: [
        './app/api/**/*.ts',
        './app/api/**/*.tsx',
        './app/auth/**/*.ts',
        './app/auth/**/*.tsx',
        './app/config/**/*.ts',
        './app/config/**/*.tsx',
        './app/**/route.ts',
        './app/**/route.tsx'
    ],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
