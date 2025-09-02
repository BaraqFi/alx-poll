'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, CheckCircle, Vote } from 'lucide-react'
import { PollService } from '@/lib/services/poll-service'
import { useAuth } from '@/components/auth/auth-context'
import { toast } from 'sonner'
import { Poll, PollResult } from '@/lib/types'

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  const { user } = useAuth()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResult[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')

  useEffect(() => {
    fetchPollData()
  }, [pollId])

  const fetchPollData = async () => {
    try {
      const [pollData, resultsData] = await Promise.all([
        PollService.getPoll(pollId),
        PollService.getPollResults(pollId),
      ])

      setPoll(pollData)
      setResults(resultsData)

      if (user) {
        const userVoted = await PollService.hasUserVoted(pollId, user.id)
        setHasVoted(userVoted)
      }
    } catch (error) {
      console.error('Error fetching poll data:', error)
      toast.error('Failed to load poll data')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (optionId: string) => {
    if (!user) {
      toast.error('You must be logged in to vote')
      return
    }

    if (hasVoted) {
      toast.error('You have already voted on this poll')
      return
    }

    if (!selectedOption) {
      toast.error('Please select an option to vote')
      return
    }

    setVoting(true)
    try {
      await PollService.voteOnPoll(pollId, optionId, user.id)
      setHasVoted(true)
      setShowThankYou(true)
      toast.success('Your vote has been recorded!')
      // Refresh the results
      const newResults = await PollService.getPollResults(pollId)
      setResults(newResults)
    } catch (error: any) {
      toast.error(error.message || 'Failed to record vote')
    } finally {
      setVoting(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedOption) {
      await handleVote(selectedOption)
    }
  }

  const getTotalVotes = () => {
    return results.reduce((total, result) => total + result.vote_count, 0)
  }

  const getPercentage = (votes: number) => {
    const total = getTotalVotes()
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading poll...</p>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Poll not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/polls" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Polls
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Poll Details</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription>{poll.description}</CardDescription>
            )}
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voting Options</h3>
                <div className="text-sm text-gray-600">
                  Total votes: {getTotalVotes()}
                </div>
              </div>

              {showThankYou ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You for Voting!</h3>
                    <p className="text-gray-600">Your vote has been recorded successfully.</p>
                  </div>
                  <Button 
                    onClick={() => setShowThankYou(false)}
                    variant="outline"
                  >
                    View Results
                  </Button>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {/* Voting Form */}
                  {!hasVoted && user && (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <RadioGroup
                        value={selectedOption}
                        onValueChange={setSelectedOption}
                        className="space-y-3"
                      >
                        {results.map((result) => (
                          <div key={result.option_id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value={result.option_id} id={result.option_id} />
                            <Label htmlFor={result.option_id} className="flex-1 cursor-pointer">
                              {result.option_text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <Button 
                        type="submit" 
                        disabled={voting || !selectedOption}
                        className="w-full"
                      >
                        {voting ? 'Submitting Vote...' : 'Submit Vote'}
                      </Button>
                    </form>
                  )}

                  {/* Results Display */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Current Results:</h4>
                    {results.map((result) => (
                      <div key={result.option_id} className="relative">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{result.option_text}</span>
                              <span className="text-sm text-gray-600">
                                {result.vote_count} votes ({getPercentage(result.vote_count)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getPercentage(result.vote_count)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No options available for this poll.
                </p>
              )}

              {hasVoted && !showThankYou && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800">You have already voted on this poll</span>
                  </div>
                </div>
              )}

              {!user && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <Vote className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800">
                      Please log in to vote on this poll
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
