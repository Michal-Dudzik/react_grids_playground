export function PlaygroundCard({ eyebrow, title, description, toolbar, footer, children }) {
  return (
    <section className="playground-card">
      <div className="playground-card__header">
        <div>
          <p className="playground-card__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="playground-card__description">{description}</p>
        </div>
        {toolbar ? <div className="playground-card__toolbar">{toolbar}</div> : null}
      </div>
      <div className="playground-card__content">{children}</div>
      {footer ? <div className="playground-card__footer">{footer}</div> : null}
    </section>
  );
}
