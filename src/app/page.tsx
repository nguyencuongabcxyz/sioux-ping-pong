import TournamentStandings from '@/components/TournamentStandings'

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#F15D03' }}>
          Tournament Standings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Company Ping Pong Tournament - Current standings across all tables
        </p>
      </div>
      
      <TournamentStandings />
    </div>
  )
}
