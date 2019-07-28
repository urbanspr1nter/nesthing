import * as React from "react";

const styles = {
  content: {
    marginTop: 16,
    marginBottom: 16
  },
  container: {
    marginLeft: 16,
    marginRight: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #e0e0e0"
  }
};

export const Footer: React.FunctionComponent = () => {
  return (
    <div style={styles.content}>
      <div style={styles.container}>
        GitHub repository:{" "}
        <a href="https://github.com/urbanspr1nter/nesthing">nesthing</a>
      </div>
      <div style={styles.container}>
        Roger Ngo. <a href="http://rogerngo.com">http://rogerngo.com</a>
      </div>
    </div>
  );
};
