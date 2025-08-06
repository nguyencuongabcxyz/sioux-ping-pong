import MatchSchedules from '@/components/MatchSchedules'

export default function SchedulesPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#F15D03' }}>
          Match Schedules
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Upcoming and completed matches across all tournament tables
        </p>
      </div>
      
      <MatchSchedules />
    </div>
  )
}