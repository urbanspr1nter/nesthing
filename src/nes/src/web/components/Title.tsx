import * as React from "react";

const styles = {
  mainTitle: {
    color: "#ff003c",
    fontFamily: "nintenderregular"
  } as React.CSSProperties
};

export interface TitleProps {
  title: string;
  subtitle: string;
}

export const MainTitle: React.FunctionComponent<TitleProps> = (
  props: TitleProps
) => {
  const { title, subtitle } = props;
  return (
    <section className="hero is-light is-bold">
      <div className="hero-body">
        <h1 className="title" style={styles.mainTitle}>
          {title}
        </h1>
        <h2 className="subtitle">{subtitle}</h2>
      </div>
    </section>
  );
};
