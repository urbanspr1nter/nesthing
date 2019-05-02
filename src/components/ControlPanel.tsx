import React from "react";

interface ControlPanelProps {
    cycles: number;
    pauseOnClick: (e: React.SyntheticEvent) => void;
    runOnClick: (e: React.SyntheticEvent) => void;
}
export default class ControlPanel extends React.Component<{}, {}> {
    constructor(props: ControlPanelProps) {
        super(props);
    }

    public render = (): JSX.Element => {
        return <></>;
    }
}