"use client"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState } from 'react'
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import QuizResult from './quiz-result';

const QuizList = ({ assessments }) => {
  const router = useRouter();
  const [selectedQuiz, setSelectedquiz] = useState(null)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="gradient-title text-3xl md:text-4xl">Recent Quizzes</CardTitle>
            <CardDescription>Review your past quiz performance</CardDescription>
          </div>
          <Button
            onClick={() => router.push("/interview/mock")}
          >Start New Quiz</Button>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {assessments?.map((assessment, index) => {
              return (
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                  key={assessment.id}
                  onClick={() => setSelectedquiz(assessment)}
                >
                  <CardHeader>
                    <CardTitle>Quiz {index + 1}</CardTitle>
                    <CardDescription className="flex justify-between w-full">
                      <div>
                        Score: {assessment.quizScore.toFixed(1)}%
                      </div>
                      <div>
                        {format(new Date(assessment.createdAt), "MMMM dd, yyyy HH:mm")}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground'> {assessment.improvementTip}</p>
                  </CardContent>

                </Card>

              )
            })}
          </div>
        </CardContent>

      </Card>

      {/*Dialog*/}

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedquiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto ">
          <DialogHeader>
            <DialogTitle>Quiz Details</DialogTitle>
          </DialogHeader>
          <QuizResult
          result={selectedQuiz}
          onStartNew={()=>router.push("/interview/mock")}
          hideStartNew
          />
        </DialogContent>
      </Dialog>

    </>
  )
}

export default QuizList