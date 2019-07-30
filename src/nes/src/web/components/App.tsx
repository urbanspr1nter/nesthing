import * as React from "react";
import { MainTitle } from "./Title";
import { ButtonMappingInfo } from "./ButtonMappingInfo";
import NesConsoleUi from "./NesConsoleUi";
import { uiGameOptions } from "../../constants";
import { Footer } from "./Footer";

export interface AppProps {
    wasmModule: any;
}

export default class App extends React.Component<AppProps> {
    constructor(props: AppProps) {
        super(props);
    }

    public render() { 
        const {wasmModule} = this.props;
        return (
            <div>
                <MainTitle title={"NesThing"} subtitle={"For this demo, a few games are supported. Choose one from the list and press \"Play\"."} />
                <ButtonMappingInfo />
                <NesConsoleUi options={uiGameOptions} wasmModule={wasmModule} />
                <Footer />
            </div>
        );
    }
}