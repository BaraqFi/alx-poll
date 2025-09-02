import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Poll, PollOption, CreatePollData } from '@/lib/types'

export class PollService {
  // Create a new poll with options
  static async createPoll(pollData: CreatePollData, userId: string): Promise<Poll | null> {
    const supabase = createClient()

    try {
      // Start a transaction by creating the poll first
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description || null,
          created_by: userId,
        })
        .select()
        .single()

      if (pollError) {
        console.error('Error creating poll:', pollError)
        throw pollError
      }

      // Create poll options
      const optionsData = pollData.options
        .filter(option => option.trim() !== '')
        .map(option => ({
          poll_id: poll.id,
          option_text: option.trim(),
        }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData)

      if (optionsError) {
        console.error('Error creating poll options:', optionsError)
        throw optionsError
      }

      return poll
    } catch (error) {
      console.error('Error in createPoll:', error)
      throw error
    }
  }

  // Get all polls with their options and vote counts
  static async getPolls(): Promise<Poll[]> {
    const supabase = createClient()

    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          votes (count)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching polls:', error)
      throw error
    }

    return polls || []
  }

  // Get a single poll with its options and vote counts
  static async getPoll(pollId: string): Promise<Poll | null> {
    const supabase = createClient()

    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          votes (count)
        )
      `)
      .eq('id', pollId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching poll:', error)
      return null
    }

    return poll
  }

  // Vote on a poll option
  static async voteOnPoll(pollId: string, optionId: string, userId: string): Promise<boolean> {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: userId,
        })

      if (error) {
        console.error('Error voting:', error)
        // Handle specific error cases
        if (error.code === '23505') {
          throw new Error('You have already voted on this poll')
        } else if (error.code === '23503') {
          throw new Error('Invalid poll or option')
        } else {
          throw new Error(error.message || 'Failed to record vote')
        }
      }

      return true
    } catch (error: any) {
      console.error('Error in voteOnPoll:', error)
      // If it's already our custom error, re-throw it
      if (error.message && !error.code) {
        throw error
      }
      // Otherwise, create a generic error
      throw new Error('Failed to record vote. Please try again.')
    }
  }

  // Check if user has already voted on a poll
  static async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user vote:', error)
      throw error
    }

    return !!data
  }

  // Get poll results
  static async getPollResults(pollId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('poll_results')
      .select('*')
      .eq('poll_id', pollId)

    if (error) {
      console.error('Error fetching poll results:', error)
      throw error
    }

    return data || []
  }
}
