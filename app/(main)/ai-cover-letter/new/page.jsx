import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import CoverLetterGenerator from '../_components/cover-letter-generator'
import { getOnboardingStatus } from '@/actions/user'
import { redirect } from 'next/navigation'

const NewCoverLetterPage = async () => {
  const { isOnboarded } = await getOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div>
        <div className='flex flex-col space-y-2'>
            <Link href="/ai-cover-letter">
            <Button variant="link" className="gap-2 pl-0">
                <ArrowLeft className='h-4 w-4'/>
                Back to Cover Letters
            </Button>
            </Link>

            <div className='pb-6'>
                <h1 className='text-6xl font-bold gradient-title'>
                Create Cover Letter
                </h1>
                <p className=' text-muted-foreground'>
                    Generate a tailored cover letter for your dream job.
                </p>
            </div>
        </div>
        <CoverLetterGenerator/>
    </div>
  )
}

export default NewCoverLetterPage