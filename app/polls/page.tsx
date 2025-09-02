'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, LogOut, Users, Calendar, Edit, Trash2, MoreVertical, Sun, Moon } from 'lucide-react'
import { PollService } from '@/lib/services/poll-service'
import { Poll } from '@/lib/types'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function PollsPage() {
  const { user, signOut } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [deletePollId, setDeletePollId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const fetchedPolls = await PollService.getPolls()
      setPolls(fetchedPolls)
    } catch (error) {
      console.error('Error fetching polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleDeletePoll = async () => {
    if (!deletePollId) return

    setDeleting(true)
    try {
      await PollService.deletePoll(deletePollId)
      toast.success('Poll deleted successfully')
      // Refresh the polls list
      await fetchPolls()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete poll')
    } finally {
      setDeleting(false)
      setDeletePollId(null)
    }
  }

  const isPollOwner = (poll: Poll) => {
    return user?.id === poll.created_by
  }

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@')
    const maskedUsername = username.length > 2 
      ? username.slice(0, 2) + '*'.repeat(username.length - 2)
      : username
    const maskedDomain = domain.split('.')[0].slice(0, 1) + '*'.repeat(domain.split('.')[0].length - 1) + '.' + domain.split('.')[1]
    return `${maskedUsername}@${maskedDomain}`
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
                PollVoter
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-200`}>
                Welcome, {user?.email ? maskEmail(user.email) : 'User'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleDarkMode}
                className={`${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors duration-200`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl casual-font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
              Polls
            </h2>
            <p className={`casual-font ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 transition-colors duration-200`}>
              Create and participate in polls
            </p>
          </div>
          <Link href="/polls/create">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
              Loading polls...
            </p>
          </div>
        ) : polls.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <Card key={poll.id} className={`
                ${isDarkMode ? 'glossy-card-dark' : 'glossy-card'}
                shadow-xl hover:shadow-2xl 
                border-0 rounded-2xl
                transform hover:scale-105
                transition-all duration-300 ease-out
                casual-font
              `}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className={`line-clamp-2 casual-font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
                        {poll.title}
                      </CardTitle>
                      {poll.description && (
                                              <CardDescription className={`line-clamp-2 casual-font ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-200`}>
                        {poll.description}
                      </CardDescription>
                      )}
                    </div>
                    {isPollOwner(poll) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 w-8 p-0 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-200`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                          <DropdownMenuItem asChild>
                            <Link href={`/polls/${poll.id}/edit`} className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Poll
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletePollId(poll.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Poll
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 transition-colors duration-200`}>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {new Date(poll.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} transition-colors duration-200`}>
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {poll.poll_options?.length || 0} options
                      </span>
                    </div>
                    <Link href={`/polls/${poll.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`
                          ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                          transition-all duration-200 hover:scale-105
                        `}
                      >
                        View Poll
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={`text-center mt-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>
            <p>No polls available yet. Create your first poll!</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePollId} onOpenChange={() => setDeletePollId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Poll</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this poll? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePoll}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
