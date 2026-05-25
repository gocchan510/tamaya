export type FestivalStatus = 'scheduled' | 'cancelled' | 'postponed'
export type SubmissionType = 'new_festival' | 'update_info' | 'lottery_info'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type Tier = 'xl' | 'l' | 'm' | 's' | 'unverified'

export interface Festival {
  id: string
  name: string
  prefecture: string
  city: string
  lat: number
  lng: number
  venue: string | null
  official_url: string | null
  walkerplus_url: string | null
  description: string | null
  ranking_score: number
  tier: Tier | null
  sources: string[] | null
  created_at: string
  updated_at: string
}

export interface FestivalYear {
  id: string
  festival_id: string
  year: number
  date: string | null
  end_date: string | null
  event_dates: string[] | null
  start_time: string | null
  end_time: string | null
  max_shell_size: string | null
  status: FestivalStatus
  fireworks_count: number | null
  expected_attendance: number | null
  date_confirmed: boolean
  paid_seats_status: 'available' | 'none' | 'unknown' | null
  created_at: string
  updated_at: string
}

export interface LotteryPeriod {
  id: string
  festival_year_id: string
  seat_name: string
  lottery_start_at: string | null
  lottery_end_at: string | null
  price_min: number | null
  price_max: number | null
  lottery_url: string | null
  created_at: string
  updated_at: string
}

export interface WeatherCache {
  id: string
  festival_year_id: string
  forecast_time: string
  fetched_at: string
  condition: string | null
  temperature: number | null
  precip_prob: number | null
  raw_json: Record<string, unknown> | null
}

export interface UserProfile {
  id: string
  push_subscription: PushSubscriptionJSON | null
  created_at: string
}

export interface UserFavorite {
  user_id: string
  festival_id: string
  created_at: string
}

export interface NotificationSubscription {
  id: string
  user_id: string
  lottery_period_id: string
  notify_start: boolean
  notify_end: boolean
  created_at: string
}

export interface DataSubmission {
  id: string
  festival_id: string | null
  festival_year_id: string | null
  submitted_by: string | null
  type: SubmissionType
  payload: Record<string, unknown>
  status: SubmissionStatus
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

// ビュー用の結合型
export interface FestivalWithYear extends Festival {
  festival_years: FestivalYear[]
}

export interface FestivalYearWithLottery extends FestivalYear {
  lottery_periods: LotteryPeriod[]
  weather_cache: WeatherCache[]
}

export interface FestivalDetail extends Festival {
  festival_years: FestivalYearWithLottery[]
}
