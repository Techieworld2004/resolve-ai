import { Link } from 'react-router-dom'

function TicketListPage() {
  return (
    <div className="page">
      <h1>Tickets</h1>

      <p>Backend connection will be added next.</p>

      <Link to="/create-ticket">
        Create Ticket
      </Link>

      <br /><br />

      <Link to="/">
        Back Home
      </Link>
    </div>
  )
}

export default TicketListPage