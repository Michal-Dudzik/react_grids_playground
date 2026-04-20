export function PlaygroundCard({ eyebrow, title, description, toolbar, footer, children }) {
  const hasHeaderContent = eyebrow || title || description || toolbar;

  return (
    <section className="playground-card">
      {hasHeaderContent ? (
        <div className="playground-card__header">
          <div>
            {eyebrow ? <p className="playground-card__eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
            {description ? <p className="playground-card__description">{description}</p> : null}
          </div>
          {toolbar ? <div className="playground-card__toolbar">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className="playground-card__content">{children}</div>
      {footer ? <div className="playground-card__footer">{footer}</div> : null}
    </section>
  );
}
