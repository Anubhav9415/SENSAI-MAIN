"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model= genAI.getGenerativeModel({
    model:"gemini-2.5-flash"

})

export const generateAIInsights=async(industry)=>{
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

    const result= await model.generateContent(prompt); // this will allow us to generate the model

    const response= result.response;

    //we need to fetch the text
    const text=response.text()

    //to clean the text 
    const cleanedText= text.replace(/```(?:json)?\n?/g,"").trim();

    //now parse it 
    return JSON.parse(cleanedText);
}



export async function getIndusrtyInsights() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
        include:{
            industryInsight:true
        }
        
    })
    if (!user) throw new Error("User not Found!!")

    let industryInsight = user.industryInsight;

    if(!industryInsight){
        //we will generate by ai 
        const insights= await generateAIInsights(user.industry);

        industryInsight = await db.industryInsight.create({
            data:{
                industry:user.industry,
                growthRate: insights.growthRate,
                demandLevel: insights.demandLevel,
                marketOutlook: insights.marketOutlook,
                salaryRanges: insights.salaryRanges,
                topSkills: JSON.stringify(insights.topSkills),
                keyTrends: JSON.stringify(insights.keyTrends),
                recommendedSkills: JSON.stringify(insights.recommendedSkills),
                nextUpdate:new Date(Date.now()+7*24*60*60*1000)
            }
        })
    }
    
    return {
        ...industryInsight,
        topSkills: typeof industryInsight.topSkills === 'string' ? JSON.parse(industryInsight.topSkills) : (industryInsight.topSkills || []),
        keyTrends: typeof industryInsight.keyTrends === 'string' ? JSON.parse(industryInsight.keyTrends) : (industryInsight.keyTrends || []),
        recommendedSkills: typeof industryInsight.recommendedSkills === 'string' ? JSON.parse(industryInsight.recommendedSkills) : (industryInsight.recommendedSkills || []),
    };
}