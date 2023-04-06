import { PrismaClient, Question } from "@prisma/client";
const prisma = new PrismaClient();
import axios from "axios";

async function main() {
    let requestBody = {
        query: "\n    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {\n  problemsetQuestionList: questionList(\n    categorySlug: $categorySlug\n    limit: $limit\n    skip: $skip\n    filters: $filters\n  ) {\n    total: totalNum\n    questions: data {\n      acRate\n      difficulty\n      freqBar\n      frontendQuestionId: questionFrontendId\n      isFavor\n      paidOnly: isPaidOnly\n      status\n      title\n      titleSlug\n      topicTags {\n        name\n        id\n        slug\n      }\n      hasSolution\n      hasVideoSolution\n    }\n  }\n}\n    ",
        variables: { categorySlug: "", skip: 0, limit: 5000, filters: {} },
    };

    let response = await axios.post(
        "https://leetcode.com/graphql/",
        requestBody,
        {
            headers: {
                "Accept-Encoding": "application/json",
            },
        }
    );

    let transformedResponse =
        response.data.data.problemsetQuestionList.questions.map(
            (question: any) => {
                if (!question.paidOnly) {
                    return {
                        id: +question.frontendQuestionId,
                        title: question.title,
                        titleSlug: question.titleSlug,
                        difficulty: question.difficulty,
                        tags: question.topicTags.map((tag: any) => tag.name),
                    };
                }
            }
        );

    transformedResponse = transformedResponse.filter(Boolean);

    await prisma.$transaction([
        prisma.question.deleteMany({}),
        prisma.question.createMany({
            data: transformedResponse,
        }),
    ]);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
