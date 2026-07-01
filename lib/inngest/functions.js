import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../prisma';
import { inngest } from './client';


//our model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model= genAI.getGenerativeModel({
    model:"gemini-2.5-flash"

})



// this function will run every sunday midnight
//each cron represnt weekdays and timings so we have set accordingly
export const generateIndustryInsights = inngest.createFunction(
    {
        id: "generate-industry-insights",
        name: "Generate Industry Insights",
        triggers: [
            {
                cron: "0 0 * * 0",
            },
        ],
    },

    //to uniquely fetch each industry
    async ({ step }) => {
        const industries = await step.run("fetch industries", async () => {
            return await db.industryInsight.findMany({
                select: { industry: true }
            })
        })

        for (const { industry } of industries) {
            const prompt = `
            Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
            {
              "salaryRanges": [
                { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
              ],
              "growthRate": number,
              "demandLevel": "HIGH" | "MEDIUM" | "LOW",
              "topSkills": ["skill1", "skill2"],
              "marketOutlook": "Positive" | "Neutral" | "Negative",
              "keyTrends": ["trend1", "trend2"],
              "recommendedSkills": ["skill1", "skill2"]
            }
            
            IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
            Include at least 5 common roles for salary ranges.
            Growth rate should be a percentage.
            Include at least 5 skills and trends.
          `;

            const res = await step.ai.wrap("gemini", async (p) => {
                return await model.generateContent(p)
            }, prompt)

            const text = res.response.candidates[0].content.parts[0].text || "";

            //clean it 
            const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

            const insights = JSON.parse(cleanedText);


            //api call
            await step.run(`Update ${industry} insights`, async () => {
                await db.industryInsight.update({
                    where: { industry },
                    data: {
                        growthRate: insights.growthRate,
                        demandLevel: insights.demandLevel,
                        marketOutlook: insights.marketOutlook,
                        salaryRanges: insights.salaryRanges,
                        topSkills: JSON.stringify(insights.topSkills),
                        keyTrends: JSON.stringify(insights.keyTrends),
                        recommendedSkills: JSON.stringify(insights.recommendedSkills),
                        lastUpdated: new Date(),
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                })
            })
        }
    }
) 