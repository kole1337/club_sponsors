import { Link } from 'react-router-dom';

export default function ForCompanies() {
  return (
    <div className="container narrow section prose">
      <h1>For companies &amp; sponsors</h1>
      <p>
        ClubSpot is a directory of Bulgarian student teams, university societies and sports clubs
        that are looking for partners. Every profile is maintained by the club itself, so what you
        see is current.
      </p>
      <h2>How to use it</h2>
      <ul>
        <li><strong>Filter</strong> the <Link to="/clubs">club directory</Link> by field (engineering, debating, a specific sport…), city, and whether the club is currently open to sponsorship.</li>
        <li><strong>Assess fit</strong> from each profile: member count, founding year, achievements, past sponsors, photo gallery and a full description.</li>
        <li><strong>See what they need</strong> — clubs tag concrete asks: funding, equipment, travel costs, event space, mentorship, or recruiting access to their members.</li>
        <li><strong>Reach out</strong> using the inquiry form on the club page. It goes straight to the club's admins, who track it in their dashboard.</li>
      </ul>
      <h2>Why sponsor a club</h2>
      <ul>
        <li>Direct access to a targeted student audience for employer branding and recruiting.</li>
        <li>Visible brand placement on kit, robots, event materials and social channels.</li>
        <li>Local community goodwill and CSR reporting material.</li>
      </ul>
      <p><Link to="/clubs" className="btn btn--primary">Browse clubs</Link></p>
    </div>
  );
}
