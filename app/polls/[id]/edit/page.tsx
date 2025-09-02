'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
import { PollService } from '@/lib/services/poll-service'
import { useAuth } from '@/components/auth/auth-context'
import { Poll, PollOption } from '@/lib/types'

export default function EditPollPage() {
  const params = useParams()
  const pollId = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<{ id: string; text: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPoll()
  }, [pollId])

  const fetchPoll = async () => {
    try {
      const pollData = await PollService.getPoll(pollId)
      if (!pollData) {
        toast.error('Poll not found')
        router.push('/polls')
        return
      }

      // Check if user owns this poll
      if (pollData.created_by !== user?.id) {
        toast.error('You can only edit your own polls')
        router.push('/polls')
        return
      }

      setPoll(pollData)
      setTitle(pollData.title)
      setDescription(pollData.description || '')
      
      // Convert poll options to editable format
      if (pollData.poll_options) {
        setOptions(pollData.poll_options.map(option => ({
          id: option.id,
          text: option.option_text
        })))
      }
    } catch (error) {
      console.error('Error fetching poll:', error)
      toast.error('Failed to load poll')
      router.push('/polls')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setOptions([...options, { id: `new-${Date.now()}`, text: '' }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index].text = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!user) {
      toast.error('You must be logged in to edit a poll')
      setSaving(false)
      return
    }

    // Filter out empty options
    const validOptions = options.filter(option => option.text.trim() !== '')

    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options')
      setSaving(false)
      return
    }

    try {
      await PollService.updatePoll(pollId, {
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions.map(option => ({
          id: option.id,
          text: option.text.trim()
        }))
      })
      
      toast.success('Poll updated successfully!')
      router.push(`/polls/${pollId}`)
    } catch (error: any) {
      console.error('Error updating poll:', error)
      toast.error(error.message || 'Failed to update poll')
    } finally {
      setSaving(false)
    }
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
              <Link href={`/polls/${pollId}`} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Poll
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Edit Poll</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Poll</CardTitle>
            <CardDescription>
              Update your poll details and options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  placeholder="Enter poll title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Enter poll description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Poll Options</Label>
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href={`/polls/${pollId}`}>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
