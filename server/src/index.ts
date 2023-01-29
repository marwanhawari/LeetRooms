import app from "./api/app";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const PORT = process.env.PORT || 5050;
const prisma = new PrismaClient();

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
