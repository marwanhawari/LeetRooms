import { PrismaClient } from "@prisma/client";
import app from "./api/app";
import { logger } from "./logger";

const PORT = process.env.PORT || 5050;

const prisma: PrismaClient = new PrismaClient()

// Use the PrismaClient instance to interact with your database



async function main() {
    app.listen(PORT, () =>
        logger.info(
            `Started API server at ${process.env.SERVER_URL} -> http://localhost:${PORT}`
        )
    );
}

main()
    .catch((error) => {
        logger.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

export default prisma;
