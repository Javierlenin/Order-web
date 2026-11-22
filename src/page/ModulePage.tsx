import "./UsersPage.css";

interface ModulePageProps {
  title: string;
}

export const ModulePage = ({ title }: ModulePageProps) => {
  return (
    <section className="users-page">
      <div className="users-page-header">
        <h2 className="users-page-title">{title}</h2>
      </div>
    </section>
  );
};
