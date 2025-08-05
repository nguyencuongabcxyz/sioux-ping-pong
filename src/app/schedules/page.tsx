import MatchSchedules from '@/components/MatchSchedules'

export default function SchedulesPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
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