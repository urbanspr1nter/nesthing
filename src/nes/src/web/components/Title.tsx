import * as React from "react";

const styles = {
  mainTitle: {
    color: "#ff003c",
    fontFamily: "nintenderregular"
  } as React.CSSProperties
};

export interface TitleProps {
  title: string;
}

export const MainTitle: React.FunctionComponent<TitleProps> = (
  props: TitleProps
) => {
  const { title } = props;
  return (
    <h1 className="title is-1" style={styles.mainTitle}>
      {title}
    </h1>
  );
};
