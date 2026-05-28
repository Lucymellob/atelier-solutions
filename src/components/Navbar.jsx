import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-2xl italic tracking-tight text-foreground">
            Atelier
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Sourcing &amp; Budget
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.22em]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }
          >
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
