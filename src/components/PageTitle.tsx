import { Link } from 'react-router-dom'

export function PageTitle({ title, crumbs }: { title: string; crumbs?: string }) {
  return (
    <div className="bg-surface">
      <div className="container-x py-6">
        <h1 className="text-2xl font-bold text-brand">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500"><Link to="/" className="hover:text-brand">Inicio</Link> / {crumbs ?? title}</p>
      </div>
    </div>
  )
}
