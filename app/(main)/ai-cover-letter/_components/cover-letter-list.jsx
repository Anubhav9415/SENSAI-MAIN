"use client"
import { deleteCoverLetter } from '@/actions/cover-letter';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const CoverletterList = ({ coverLetters }) => {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("CoverLetter deleted successfully")
      router.refresh();
    } catch (error) {
      toast.error(error.message || "failed to delete coverletter")

    }
  };

  if (!coverLetters?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Cover Letters yet.</CardTitle>
          <CardDescription>Create your first cover letter to get started</CardDescription>
        </CardHeader>
      </Card>

    )
  };

  return (
    <div className='space-y-4'>
      {coverLetters?.map((letter) => (
        <Card key={letter.id} className='group-relative'>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle className="text-xl graident-title">
                  {letter.jobTitle} at {letter.companyName}
                </CardTitle>
                <CardDescription>
                  Created {format(new Date(letter.createdAt), "PPP")}
                </CardDescription>
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                >
                  <Eye className='h-4 w-4' />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='outline' size='icon'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete cover Letter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your cover letter for {letter.jobTitle} at{" "}
                        {letter.companyName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm line-clamp-3">
              {letter.jobDescription}
            </div>
          </CardContent>

        </Card>
      ))}

    </div>
  )
}

export default CoverletterList