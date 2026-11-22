import './SearchBar.css';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <input
        type="search"
        className="search-bar"
        placeholder="Buscar por nombre o correo"
        aria-label="Buscar usuarios"
        value={value}
        onChange={(event) => onChange(event.target.value)}
    />
  )
}
