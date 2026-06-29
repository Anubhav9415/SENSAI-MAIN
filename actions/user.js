"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";


export async function updateUser(data) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unatuhrozied")

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId
        }
    })
    if (!user) throw new Error("User doesn't exist");


    try {
        // 1. Find if the industry insight exists first
        let industryInsight = await db.industryInsight.findUnique({
            where: {
                industry: data.industry
            }
        });

        // 2. If industry doesn't exist, generate insights using AI and save it
        if (!industryInsight) {
            const insights = await generateAIInsights(data.industry);

            industryInsight = await db.industryInsight.create({
                data: {
                    industry: data.industry,
                    growthRate: insights.growthRate,
                    demandLevel: insights.demandLevel,
                    marketOutlook: insights.marketOutlook,
                    salaryRanges: insights.salaryRanges,
                    topSkills: JSON.stringify(insights.topSkills),
                    keyTrends: JSON.stringify(insights.keyTrends),
                    recommendedSkills: JSON.stringify(insights.recommendedSkills),
                    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });
        }

        // 3. Update the user profile
        const updatedUser = await db.user.update({
            where: {
                id: user.id
            },
            data: {
                industry: data.industry,
                experience: data.experience,
                bio: data.bio,
                skills: JSON.stringify(data.skills)
            }
        });

        return updatedUser;
    } catch (error) {
        console.error("Error while updating user and Industry", error.message);
        throw new Error("Failed to update profile: " + error.message)
    }
}

// we'll use transaction functinality of prisma , that ensures all three actions are performed ,if not give error 

export async function getOnboardingStatus() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId
        }
    })
    if (!user) throw new Error("User is not valid")

    try {
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId
            },
            select: {
                industry: true
            }
        })
        return {
            isOnboarded: !!user?.industry
        }
    } catch (error) {
        console.error("Error checking onboarding status:", error.message)
        throw new Error("failed to check onboarding status")
    }
}