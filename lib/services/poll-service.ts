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

  // Delete a poll (soft delete by setting is_active to false)
  static async deletePoll(pollId: string): Promise<boolean> {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('id', pollId)

      if (error) {
        console.error('Error deleting poll:', error)
        throw error
      }

      return true
    } catch (error: any) {
      console.error('Error in deletePoll:', error)
      throw new Error('Failed to delete poll')
    }
  }

  // Update a poll and its options
  static async updatePoll(pollId: string, pollData: {
    title: string
    description?: string
    options: { id: string; text: string }[]
  }): Promise<boolean> {
    const supabase = createClient()

    try {
      // Update the poll
      const { error: pollError } = await supabase
        .from('polls')
        .update({
          title: pollData.title,
          description: pollData.description || null,
        })
        .eq('id', pollId)

      if (pollError) {
        console.error('Error updating poll:', pollError)
        throw pollError
      }

      // Get existing options to compare
      const { data: existingOptions } = await supabase
        .from('poll_options')
        .select('id')
        .eq('poll_id', pollId)

      const existingOptionIds = existingOptions?.map(opt => opt.id) || []
      const newOptionIds = pollData.options
        .filter(opt => !opt.id.startsWith('new-'))
        .map(opt => opt.id)

      // Delete options that are no longer present
      const optionsToDelete = existingOptionIds.filter(id => !newOptionIds.includes(id))
      if (optionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('poll_options')
          .delete()
          .in('id', optionsToDelete)

        if (deleteError) {
          console.error('Error deleting options:', deleteError)
          throw deleteError
        }
      }

      // Update existing options and insert new ones
      for (const option of pollData.options) {
        if (option.id.startsWith('new-')) {
          // Insert new option
          const { error: insertError } = await supabase
            .from('poll_options')
            .insert({
              poll_id: pollId,
              option_text: option.text,
            })

          if (insertError) {
            console.error('Error inserting option:', insertError)
            throw insertError
          }
        } else {
          // Update existing option
          const { error: updateError } = await supabase
            .from('poll_options')
            .update({ option_text: option.text })
            .eq('id', option.id)

          if (updateError) {
            console.error('Error updating option:', updateError)
            throw updateError
          }
        }
      }

      return true
    } catch (error: any) {
      console.error('Error in updatePoll:', error)
      throw new Error('Failed to update poll')
    }
  }
}
