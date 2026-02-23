import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "WDP-ECS API",
      description: "Hệ thống Chăm sóc Mắt",
      version: "0.1.0",
    },
    servers: [{ url: "http://localhost:5000", description: "Development" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token từ POST /api/auth/login",
        },
      },
      schemas: {
        Service: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ServiceCreate: {
          type: "object",
          required: ["name", "description", "price"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number", minimum: 0 },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.route.js"],
};

const swaggerDocument = swaggerJsdoc(options);
export default swaggerDocument;
