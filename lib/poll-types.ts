export interface Poll {
  id: string
  title: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  poll_options?: PollOption[]
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  created_at: string
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}

export interface PollWithOptions extends Poll {
  options: PollOption[]
  vote_count?: number
}

export interface PollResult {
  poll_id: string
  poll_title: string
  poll_description?: string
  option_id: string
  option_text: string
  vote_count: number
  created_at: string
  created_by: string
}

export interface CreatePollData {
  title: string
  description?: string
  options: string[]
}
