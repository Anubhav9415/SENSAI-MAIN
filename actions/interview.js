"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai";



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"

})

//apis for mock intereview
export async function generateQuiz() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId
        },
        select:{
            industry:true,
            skills:true
        }
    })
    if (!user) throw new Error("User Not Found");

    const skills = user.skills ? JSON.parse(user.skills) : [];

    try {
        //prompt for generating our interview Quiz
        const prompt = `
        Generate 10 technical interview questions for a ${user.industry
            } professional${skills.length ? ` with expertise in ${skills.join(", ")}` : ""
            }.
        
        Each question should be multiple choice with 4 options.
        
        Return the response in this JSON format only, no additional text:
        {
          "questions": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": "string",
              "explanation": "string"
            }
          ]
        }
      `;

        //now to structure or reponse
        const result = await model.generateContent(prompt)
        const response = result.response;
        const text = response.text();

        //clean the response
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        const jsonStart = cleanedText.indexOf("{");
        const jsonEnd = cleanedText.lastIndexOf("}");
        let jsonToParse = cleanedText;
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonToParse = cleanedText.substring(jsonStart, jsonEnd + 1);
        }
        const quiz = JSON.parse(jsonToParse);

        return quiz.questions;
    } catch (error) {
        console.error("Error Generating Quiz", error)
        throw new Error("Failed to generate quiz questions")
    }

}


// to save the result of the quiz
export async function saveQuizResult(questions, answers, score) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId
        }
    })
    if (!user) throw new Error("User Not Found");


    const questionResults = questions.map((q, index) => ({
        question: q.question,
        answer: q.correctAnswer,
        userAnswer: answers[index],
        isCorrect: q.correctAnswer === answers[index],
        explanation: q.explanation,
    }))


    const wrongAnswer = questionResults.filter((q) => !q.isCorrect);
    let improvementTip=null;

    //now feed it to gemini

    if (wrongAnswer.length > 0) {
        const wrongQuestionsText = wrongAnswer.map((q) =>
            `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
        )
            .join("\n\n");



        const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;


    //now lets call the gemini api

        try {
             //now to structure or reponse
        const result = await model.generateContent(improvementPrompt)
        const response = result.response;
         improvementTip = response.text().trim();


        } catch (error) {
            console.error("Error generating tip:",error)
        }
    }

    //now lets store it in our database feed it to our asseesment table
    try {
        const assessment = await db.assessment.create({
            data:{
                userId:user.id,
                quizScore:score,
                questions:questionResults,
                category:"Technical",
                improvementTip,
            }
        });
        return assessment;
    } catch (error) {
        console.error("Error saving Quiz result",error)
        throw new Error("Failed to save quiz result")
    }
}


export async function getAssessments(){
    const {userId}=await auth()
    if(!userId) throw new Error("Unauthorized")

        const user = await db.user.findUnique({
            where:{
                clerkUserId:userId
            }
        })
    if(!user) throw new Error ("User not found")


    try {
        const assessments=await db.assessment.findMany({
            where:{
                userId:user.id

            },
            orderBy:{
                createdAt:"asc"
            }
        })
        return assessments
    } catch (error) {
        console.error("Error while fetching the assessments")
        throw new Error("Failed to fetch assessments")
        
    }
}